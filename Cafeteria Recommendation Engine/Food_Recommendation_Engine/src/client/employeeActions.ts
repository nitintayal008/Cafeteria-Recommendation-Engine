import { socket, loggedInUser } from "./client";
import { askQuestion, promptUser, rl } from "../server/utils/promptUtils";

export function handleEmployeeChoice(choice: string) {
  switch (choice) {
    case "1":
      updateProfile();
      break;
    case "2":
      getMenu();
      break;
    case "3":
      giveFeedback();
      break;
    case "4":
      getRolloutItems();
      break;
    case "5":
      viewNotification();
      break;
    case "6":
      viewDiscardedItems();
      break;
    case "7":
      logLogout();
      rl.close();
      socket.close();
      console.log("Goodbye!");
      break;
    default:
      console.log("Invalid choice, please try again.");
      promptUser("employee");
      break;
  }
}

async function updateProfile() {
  try {
    console.log("Please answer these questions to update your preferences:");
    const foodType = await askQuestion("1) Select one - Vegetarian, Non Vegetarian, Eggetarian: ");
    const spiceLevel = await askQuestion("2) Select your spice level - High, Medium, Low: ");
    const cuisine = await askQuestion("3) Select your cuisine preference - North Indian, South Indian, Other: ");
    const sweetTooth = await askQuestion("4) Do you have a sweet tooth? (Yes/No): ");
    
    const profileData = {
      foodType: foodType.trim(),
      spiceLevel: spiceLevel.trim(),
      cuisine: cuisine.trim(),
      sweetTooth: sweetTooth.trim().toLowerCase() === "yes"
    };

    socket.emit("updateProfile", profileData, loggedInUser?.employeeId, (response: any) => {
      console.log(response.message);
      setTimeout(() => {
        promptUser("employee");
      }, 200);
    });
  } catch (error) {
    console.error("Error updating profile:", error);
  }
}

function getMenu() {
  socket.emit("getMenu", (response: any) => {
    console.table(response.menuItems);
    promptUser("employee");
  });
}

function giveFeedback() {
  rl.question("Enter item ID to give feedback on: ", (itemId) => {
    const id = parseInt(itemId);

    socket.emit("checkFoodItemExistence", id, (exists: boolean) => {
      if (exists) {
        rl.question("Enter your comment: ", (comment) => {
          rl.question("Enter your rating (1-5): ", (rating) => {
            socket.emit(
              "giveFeedback",
              {
                itemId: parseInt(itemId),
                comment,
                rating: parseInt(rating),
              },
              (response: any) => {
                console.log(response);
                promptUser("employee");
              }
            );
          });
        });
      } else {
        console.log(`Menu item with ID ${itemId} does not exist.`);
        promptUser("employee");
      }
    });
  });
}

function getRolloutItems() {
  socket.emit("getRolloutItems", loggedInUser, (response: any) => {
    console.log(response);
    if (loggedInUser) {
      voteTomorrowFood(loggedInUser.name);
    } else {
      console.log("User not logged in");
      promptUser("employee");
    }
  });
}

function viewNotification() {
  socket.emit("viewNotification", (response: any) => {
    console.table(response.notification);
    promptUser("employee");
  });
}

async function logLogout() {
  if(loggedInUser){
    socket.emit("LogLogout", loggedInUser.employeeId, "logout", (response: any) => {
      console.log(response.message);
    });
  }
}

async function viewDiscardedItems() {
  socket.emit("viewDiscardedItems", async (response: any) => {
    console.table(response.discardedItems);
    if(response.discardedItems.length){
      console.log('Please provide detailed feedback for the following menu items:');
      for (const item of response.discardedItems) {
          const question1 = `What you did not like about ${item.item_name}?`;
          const question2 = `How would you like ${item.item_name} to taste?`;
          const question3 = `Share your mom's recipe if you want.`;
        const inputQ1 = await askQuestion(`What you did not like about ${item.item_name}?`);
        const inputQ2 = await askQuestion(`How would you like ${item.item_name} to taste?`);
        const inputQ3 = await askQuestion(`Share your mom's recipe if you want.`);
        socket.emit(
            'saveDetailedFeedback', 
            item.item_name,
            loggedInUser?.employeeId,
             [question1, question2, question3], 
             [inputQ1, inputQ2, inputQ3],
              (response: any) => {
                // console.log(response);
              }
        );
      }
      console.log("\nYour feedback has been recorded successfully.\n");
      promptUser("employee");
    }
    else
    {
      console.log("Chef has not asked for detailed feedback of any menu item.");
      promptUser("employee");
    }
  });
}

async function answerDiscardItem(questions: string[]) {
  for (const question of questions) {
    const answer = await askQuestion(`${question}`);
    socket.emit("saveSolution", question, answer, loggedInUser?.employeeId, (result: string) => {
      console.log(result);
    });
    console.log('Your response has been recorded successfully.\n');
  }
  promptUser("employee");
}

async function voteTomorrowFood(username: string) {
  const mealTypes = ["breakfast", "lunch", "dinner"];
  for (const mealType of mealTypes) {
    let item: string;
    let exists = "false";
    do {
      item = await askQuestion(`Please select one item for ${mealType}: `);
      await new Promise<void>((resolve) => {
        socket.emit("voteFood", item, mealType, username, (result: string) => {
          exists = result;
          console.log(exists);
          resolve();
        });
      });
    } while (!exists);
  }
  console.log("Your responses have been recorded successfully.\n");
  promptUser("employee");
}
