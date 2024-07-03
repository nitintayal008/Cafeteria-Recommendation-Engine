import { askQuestion, promptUser, rl } from "../server/utils/promptUtils";
import { loggedInUser, socket } from "./client";

export function handleChefChoice(choice: string) {
  switch (choice) {
    case "1":
      socket.emit("getMenu", (response: any) => {
        socket.emit('createAndViewDiscardList', response.menuItems, (response: any) => {
          console.log("Discarded Item:", response.DiscardedItem);
          if (response.success) {
            handleDiscardOptions(response.DiscardedItem);
          } else {
            promptUser("chef");
          }
        });
      });
      break;
    case "2":
      socket.emit("viewMonthlyFeedback", (response: any) => {
        console.table(response.feedbackReport);
        promptUser("chef");
      });
      break;
    case "3":
      rl.question("Enter item ID to view feedback: ", (id) => {
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
      });
      break;
    case "4":
      socket.emit("getRecommendation", (response: any) => {
        console.table(response.menuItems);
        promptUser("chef");
      });
      break;
    case "5":
      socket.emit("getMenu", (response: any) => {
        console.table(response.menuItems);
        promptUser("chef");
      });
      break;
    case "6":
      socket.emit("getTopRecommendations", (response: any) => {
        console.table(response.items);
        if (loggedInUser) {
          rolloutFoodItems();
        } else {
          console.log("User not logged in");
          promptUser("chef");
        }
      });
      break;
    case "7":
      socket.emit("checkResponses", (response: any) => {
        console.log(response);
        promptUser("chef");
      });
      break;
    case "8":
      socket.emit("selectTodayMeal", (response: any) => {
        console.log(response);
        if (loggedInUser) {
          selectMeal();
        } else {
          console.log("User not logged in");
          promptUser("chef");
        }
      });
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
}

function handleDiscardOptions(discardedItem: string) {
  console.log(`\nOptions for Discarded Item (${discardedItem}):`);
  console.log("1) Remove the Food Item from Menu List");
  console.log("2) Get Detailed Feedback");
  rl.question("Enter your choice: ", (choice) => {
    switch (choice) {
      case "1":
        removeFoodItem();
        break;
      case "2":
        rollOutFeedbackQuestions(discardedItem);
        break;
      default:
        console.log("Invalid choice, returning to chef menu.");
        promptUser("chef");
        break;
    }
  });
}

function removeFoodItem() {
  rl.question(`Enter the name of the food item to remove : `, (itemName) => {
    socket.emit("removeFoodItem", itemName, (response: any) => {
      console.log(response.message);
      promptUser("chef");
    });
  });
}

async function rollOutFeedbackQuestions(discardedItem: string) {
  console.log(`Rolling out questions for detailed feedback on ${discardedItem}.`);
  const questions = [
    `What didn’t you like about ${discardedItem}?`,
    `How would you like ${discardedItem} to taste?`,
    `Share your mom’s recipe for ${discardedItem}.`
  ];

  for (let i = 0; i < questions.length; i++) {
    await sendFeedbackQuestion(discardedItem, questions[i]);
  }

  console.log("All feedback questions have been rolled out.");
  setTimeout(() => {
    promptUser("chef");
  }, 200);
}

function sendFeedbackQuestion(discardedItem: string, question: string) {
  return new Promise((resolve) => {
    socket.emit("sendFeedbackQuestion", { discardedItem, question }, (res: any) => {
      // console.log(res.message);
      resolve(res);
    });
  });
}

async function rolloutFoodItems() {
  const mealTimes = ["breakfast", "lunch", "dinner"];
  for (const mealTime of mealTimes) {
    console.log(`Please enter the names of three items for ${mealTime}:`);
    const items: Array<string> = [];
    for (let i = 0; i < 3; i++) {
      const item = await askQuestion(`Enter item ${i + 1}: `);
      items.push(item);
    }
    socket.emit("rolloutFoodItem", mealTime, items);
  }
  console.log("Menu items rolled out successfully.\n");
  promptUser("chef");
}

async function selectMeal() {
  try {
    const mealForBreakfast = await askQuestion("Enter Meal to be cooked for breakfast: ");
    const mealForLunch = await askQuestion("Enter Meal to be cooked for lunch: ");
    const mealForDinner = await askQuestion("Enter Meal to be cooked for dinner: ");

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
