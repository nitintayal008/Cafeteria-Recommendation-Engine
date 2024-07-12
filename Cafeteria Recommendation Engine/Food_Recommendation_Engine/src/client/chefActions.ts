import { menuRepository } from "../server/repositories/menuRepository";
import { askQuestion, askQuestionAsync, promptUser, rl } from "../server/utils/promptUtils";
import { loggedInUser, socket } from "./client";
 
export async function handleChefChoice(choice: string) {
  try {
    switch (choice) {
      case "1":
        await handleDiscardList();
        break;
      case "2":
        await viewMonthlyFeedback();
        break;
      case "3":
        await viewFeedbackForItem();
        break;
      case "4":
        await viewRecommendations();
        break;
      case "5":
        await viewMenu();
        break;
      case "6":
        await handleTopRecommendations();
        break;
      case "7":
        await checkResponses();
        break;
      case "8":
        await selectTodayMeal();
        break;
      case "9":
        await getDiscardMenuItems();
        break;
      case "10":
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

function handleDiscardOptions(discardedItem: any, discardedItemNames: any) {
  console.log(`\nOptions for Discarded Item (${discardedItem}):`);
  console.log("1) Remove the Food Item from Menu List");
  console.log("2) Get Detailed Feedback");
  console.log("3) Fetch Detailed Feedback");
  rl.question("Enter your choice: ", async (choice) => {
    switch (choice) {
      case "1":
        removeFoodItem();
        break;
      case "2":
        const itemToGetFeedback =await askQuestion('Enter the name of the item to get detailed feedback for: ');
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

function removeFoodItem() {
  rl.question("Enter the name of the food item to remove: ", (itemName) => {
    socket.emit("removeFoodItem", itemName, (response: any) => {
      console.log(response.message);
      promptUser("chef");
    });
  });
}

function fetchDetailedFeedback() {
  rl.question("Enter the name of the food item to fetch detailed feedback: ", (itemName) => {
    socket.emit("fetchDetailedFeedback", itemName, (response: any) => {
      console.table(response.feedback);
      response.feedback.forEach((feedback: any) => {
        console.log('Question: ' + feedback.question);
        console.log('Feedback: ' + feedback.response);
        console.log('----------------------------------------------------------------------------');
    });
      promptUser("chef");
    });
  });
}

async function rollOutFeedbackQuestions(discardedItem: string) {
  socket.emit("checkMonthlyUsage", discardedItem, async (response: any)=>{
    console.log(response);
    console.log("result_nitin",response.canUse, discardedItem);
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
    console.table(response.menuItems);
    promptUser("chef");
  });
}

function viewMenu() {
  socket.emit("getMenu", (response: any) => {
    console.table(response.menuItems);
    promptUser("chef");
  });
}

async function handleTopRecommendations() {
  socket.emit("getTopRecommendations", (response: any) => {
    console.table(response.items);
    if (loggedInUser) {
      rolloutFoodItems();
    } else {
      console.log("User not logged in");
      promptUser("chef");
    }
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
    socket.emit("selectTodayMeal", (response: any) => {
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
          selectMeal(); 
        } else {
          console.log("User not logged in");
          promptUser("chef");
        }
      } else {
        console.log("Failed to fetch today's meals.");
        promptUser("chef");
      }
    });
  } catch (error) {
    console.error("Error selecting today's meal:", error);
  }
}

async function rolloutFoodItems() {
  const mealTimes = ["breakfast", "lunch", "dinner"];
  for (const mealTime of mealTimes) {
    console.log(`Please enter the names of three items for ${mealTime}:`);
    const items: Array<string> = [];
    for (let i = 0; i < 3; i++) {
      const item = await askQuestionAsync(`Enter item ${i + 1}: `);
      items.push(item);
    }
    socket.emit("rolloutFoodItem", mealTime, items);
  }
  console.log("Menu items rolled out successfully.\n");
  promptUser("chef");
}

async function selectMeal() {
  try {
    const mealForBreakfast = await askQuestionAsync("Enter Meal to be cooked for breakfast: ");
    const mealForLunch = await askQuestionAsync("Enter Meal to be cooked for lunch: ");
    const mealForDinner = await askQuestionAsync("Enter Meal to be cooked for dinner: ");

    const meals = { mealForBreakfast, mealForLunch, mealForDinner };
    socket.emit("saveSelectedMeal", meals, (response: any) => {
      console.log(response);
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
