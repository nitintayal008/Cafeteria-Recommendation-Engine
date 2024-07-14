import { menuRepository } from "../server/repositories/menuRepository";
import { isMenuItemValid } from "../server/services/chefService";
import { askQuestion, askQuestionAsync, promptUser, rl } from "../server/utils/promptUtils";
import { loggedInUser, socket } from "./client";
 
export async function handleChefChoice(choice: string) {
  try {
    switch (choice) {
      case "1":
        await viewMonthlyFeedback();
        break;
      case "2":
        await viewFeedbackForItem();
        break;
      case "3":
        await viewRecommendations();
        break;
      case "4":
        await viewMenu();
        break;
      case "5":
        await handleTopRecommendations();
        break;
      case "6":
        await checkResponses();
        break;
      case "7":
        await selectTodayMeal();
        break;
      case "8":
        await getDiscardMenuItems();
        break;
      case "9":
        rl.close();
        socket.close();
        console.log("Goodbye!");
        break;
      default:
        console.log("Invalid choice, please try again.");
        promptUser("chef");
        break;
    }
  } catch (error) {
    console.error("Error handling chef choice:", error);
  }
}

async function askForFoodItem(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("Enter the name of the food item to fetch detailed feedback: ", resolve);
  });
}

async function askForFoodItemToRemove(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("Enter the name of the food item to remove: ", resolve);
  });
}

async function handleDiscardList() {
  socket.emit("getMenu", (response: any) => {
    socket.emit("createAndViewDiscardList", response.menuItems, (response: any) => {
      console.log("Discarded Item:", response.DiscardedItem);
      if (response.success) {
        // handleDiscardOptions(response.DiscardedItem, );
      } else {
        promptUser("chef");
      }
    });
  });
}

async function getValidMenuItem(promptMessage: string): Promise<string> {
  while (true) {
    const itemName = await askQuestion(promptMessage);
    if (await isMenuItemValid(itemName)) {
      return itemName;
    } else {
      console.log("The entered item is not present in the menu. Please enter a valid menu item.");
    }
  }
}

function handleDiscardOptions(discardedItem: any, discardedItemNames: any) {
  console.log(`\nOptions for Discarded Item `);
  console.log("1) Remove the Food Item from Menu List");
  console.log("2) Get Detailed Feedback");
  console.log("3) Fetch Detailed Feedback");
  rl.question("Enter your choice: ", async (choice) => {
    switch (choice) {
      case "1":
        removeFoodItem();
        break;
        case "2":
          const itemToGetFeedback = await getValidMenuItem('Enter the name of the item to get detailed feedback for: ');
          rollOutFeedbackQuestions(itemToGetFeedback);
          break;
      case "3": 
        fetchDetailedFeedback();
        break;
      default:
        console.log("Invalid choice, returning to chef menu.");
        promptUser("chef");
        break;
    }
  });
}

async function removeFoodItem() {

  try {
    while (true) {
      const itemName = await askForFoodItemToRemove();
      if (await isMenuItemValid(itemName)) {
        socket.emit("removeFoodItem", itemName, (response: any) => {
          console.log(response.message);
          promptUser("chef");
        });
        break;
      } else {
        console.log("The entered item is not present in the menu. Please enter a valid menu item.");
      }
    }
  } catch (error) {
    console.error("Error removing food item:", error);
    promptUser("chef");
  }
}

async function fetchDetailedFeedback() {
  try {
    let itemName;
    while (true) {
      itemName = await askForFoodItem();
      if (await isMenuItemValid(itemName)) {
        break;
      } else {
        console.log("The entered item is not present in the menu. Please enter a valid menu item.");
      }
    }

    socket.emit("fetchDetailedFeedback", itemName, (response: any) => {
      if (response.success === false) {
        console.log(response.message);
        promptUser("chef");
        return;
      }

      const feedbackDict: { [key: string]: string[] } = {};

      response.feedback.forEach((feedback: any) => {
        if (!feedbackDict[feedback.question]) {
          feedbackDict[feedback.question] = [];
        }
        feedbackDict[feedback.question].push(feedback.response);
      });

      Object.keys(feedbackDict).forEach((question) => {
        console.log('Question: ' + question);
        feedbackDict[question].forEach((response, index) => {
          console.log(`Feedback${index + 1}: ${response}`);
        });
        console.log('----------------------------------------------------------------------------');
      });

      promptUser("chef");
    });
  } catch (error) {
    console.error("Error fetching detailed feedback:", error);
    promptUser("chef");
  }
}

async function rollOutFeedbackQuestions(discardedItem: string) {
  socket.emit("checkMonthlyUsage", discardedItem, async (response: any)=>{
    // console.log(response);
    if(response.canUse){
      await menuRepository.logMonthlyUsage(`getDetailedFeedback-${discardedItem}`);
      console.log(`Rolling out questions for detailed feedback on ${discardedItem}.`);
      const questions = [
        `What didn’t you like about ${discardedItem}?`,
        `How would you like ${discardedItem} to taste?`,
        `Share your mom’s recipe for ${discardedItem}.`
      ];
    
      for (const question of questions) {
        console.log("i am inside");
        await sendFeedbackQuestion(discardedItem, question);
      }
    
      console.log("All feedback questions have been rolled out.");
      setTimeout(() => {
        promptUser("chef");
      }, 200);
    }else{
      console.log(`Feedback for ${discardedItem} has been asked already this month. Try again next month.`)
      promptUser("chef");
    }
  })
}

function sendFeedbackQuestion(discardedItem: string, question: string) {
  return new Promise((resolve) => {
    socket.emit("sendFeedbackQuestion", { discardedItem, question }, (res: any) => {
      resolve(res);
    });
  });
}

function viewMonthlyFeedback() {
  socket.emit("viewMonthlyFeedback", (response: any) => {
    console.log("\x1b[32m                   --- Monthly Feedback Report ---\x1b[0m");
    console.table(response.feedbackReport);
    promptUser("chef");
  });
}

async function viewFeedbackForItem() {
  try {
    const id = await askQuestionAsync("Enter item ID to view feedback: ");
    const itemId = parseInt(id);
    socket.emit("checkFoodItemExistence", itemId, (exists: boolean) => {
      if (exists) {
        socket.emit("viewFeedback", itemId, (response: any) => {
          if (response.success) {
            console.table(response.feedback);
          } else {
            console.log("Failed to fetch feedback or no feedback available.");
          }
          promptUser("chef");
        });
      } else {
        console.log(`Menu item with ID ${itemId} does not exist.`);
        promptUser("chef");
      }
    });
  } catch (error) {
    console.error("Error viewing feedback for item:", error);
  }
}

function viewRecommendations() {
  socket.emit("getRecommendation", (response: any) => {
    const modifiedMenuItems = response.menuItems.map((item: any) => {
      const { next_day_menu, ...rest } = item;
      return rest;
    });
    console.table(modifiedMenuItems);
    promptUser("chef");
  });
}

function viewMenu() {
  socket.emit("getMenu", (response: any) => {
    const modifiedMenuItems = response.menuItems.map((item: any) => {
      const { next_day_menu,id, ...filteredItem } = item;

      Object.keys(filteredItem).forEach(key => {
        if (filteredItem[key] === null) {
          filteredItem[key] = "Not Availble";
        }
      });

      return filteredItem;
    });

    console.table(modifiedMenuItems);
    promptUser("chef");
  });
}

async function handleTopRecommendations() {
  socket.emit("getTopRecommendations", (response: any) => {
    console.table(response.items);
    socket.emit("checkIfAlreadyResponded", (response: any) => {
      // console.log(response);
      if (response.sucess) {
        console.log("Menu items have already been rolled out for today. Please wait until tomorrow.");
        promptUser("chef");
      } else {
        if (loggedInUser) {
          rolloutFoodItems();
        } else {
          console.log("User not logged in");
        }
      }
    });
  });
}


function checkResponses() {
  socket.emit("checkResponses", (response: any) => {
    if (response.success) {
      response.messages.forEach((message: any) => {
        console.log(message);
      });
    } else {
      console.log("Failed to fetch responses.");
    }
    promptUser("chef");
  });
}

async function selectTodayMeal() {
  try {
    socket.emit("selectTodayMeal", async (response: any) => {
      if (response.success) {
        const { meals } = response;
        
        console.log("\x1b[32m--- Today's Meals ---\x1b[0m");

        if (meals.breakfast && meals.breakfast.length > 0) {
          console.log("\x1b[36m--- Breakfast ---\x1b[0m");
          meals.breakfast.forEach((meal: any) => {
            console.log(`Item: ${meal.name}, Votes: ${meal.vote_count}`);
          });
        } else {
          console.log("No breakfast items selected.");
        }

        if (meals.lunch && meals.lunch.length > 0) {
          console.log("\x1b[36m--- Lunch ---\x1b[0m");
          meals.lunch.forEach((meal: any) => {
            console.log(`Item: ${meal.name}, Votes: ${meal.vote_count}`);
          });
        } else {
          console.log("No lunch items selected.");
        }

        if (meals.dinner && meals.dinner.length > 0) {
          console.log("\x1b[36m--- Dinner ---\x1b[0m");
          meals.dinner.forEach((meal: any) => {
            console.log(`Item: ${meal.name}, Votes: ${meal.vote_count}`);
          });
        } else {
          console.log("No dinner items selected.");
        }
        
        if (loggedInUser) {
          const mealsAlreadySelected = await menuRepository.areMealsSelectedForToday();
          if (!mealsAlreadySelected) {
            selectMeal(); 
          } else {
            console.log("\x1b[32mMeals are already selected for today.\x1b[0m");
            promptUser("chef")
          }
        } else {
          console.log("User not logged in");
        }
      } else {
        console.log("Failed to fetch today's meals.");
      }
    });
  } catch (error) {
    console.error("Error selecting today's meal:", error);
    promptUser("chef"); // Handle error and prompt user
  }
}

async function rolloutFoodItems() {
  const mealTimes = ["breakfast", "lunch", "dinner"];
  for (const mealTime of mealTimes) {
    console.log(`Please enter the names of three items for ${mealTime}:`);
    const items: Array<string> = [];
    for (let i = 0; i < 3; i++) {
      let item: string;
      while (true) {
        item = await askQuestionAsync(`Enter item ${i + 1}: `);
        if (await isMenuItemValid(item)) {
          break;
        } else {
          console.log("The entered item is not present in the menu. Please enter a valid menu item.");
        }
      }
      items.push(item);
    }
    socket.emit("rolloutFoodItem", mealTime, items);
  }
  console.log("Menu items rolled out successfully.\n");
  promptUser("chef");
}

async function selectMeal() {
  try {
    const meals = { mealForBreakfast: "", mealForLunch: "", mealForDinner: ""};

    const getValidatedMeal = async (mealTime: string) => {
      while (true) {
        const meal = await askQuestionAsync(`Enter Meal to be cooked for ${mealTime}: `);
        if (await isMenuItemValid(meal)) {
          return meal;
        } else {
          console.log(`The entered item for ${mealTime} is not present in the menu. Please enter a valid menu item.`);
        }
      }
    };

    meals.mealForBreakfast = await getValidatedMeal("breakfast");
    meals.mealForLunch = await getValidatedMeal("lunch");
    meals.mealForDinner = await getValidatedMeal("dinner");

    socket.emit("saveSelectedMeal", meals, (response: any) => {
      // console.log(response);
      console.log("\x1b[32mMeals Selected Successfully.\x1b[0m");
      console.log("\x1b[36mThank you for selecting today's meals.\x1b[0m"); 
      console.log("\x1b[35mNotification sent to the Employee.\x1b[0m"); 
      
    });
  } catch (error) {
    console.error("Error selecting meals:", error);
  } finally {
    setTimeout(() => {
      promptUser("chef");
    }, 200);
  }
}

async function getDiscardMenuItems(){
  socket.emit("getDiscardMenuItems", (response: any) => {
    console.table(response.discardMenuItems);
  if(response.discardMenuItems){
    let discardedItemNames: Array<string> = [];
    console.log("Menu Items to be discarded:");
    response.discardMenuItems.forEach((item: any) => {
      discardedItemNames.push(item.item_name);
      console.log(`ID: ${item.id}, Name: ${item.name}, Average Rating: ${item.average_rating}, Sentiment Score: ${item.sentiment_score}`);
    });
    handleDiscardOptions(response.discardMenuItems, discardedItemNames);
  }
  }
)}
