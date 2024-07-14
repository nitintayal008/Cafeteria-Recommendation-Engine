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
    const filteredMenuItems = response.menuItems.map((item: any) => {
      const { next_day_menu, ...rest } = item;
      
      for (const key in rest) {
        if (rest[key] === null) {
          rest[key] = 'Not Available';
        }
      }
      return rest;
    });

    console.table(filteredMenuItems);
    promptUser("employee");
  });
}

function giveFeedback() {
  function askForItemId() {
    rl.question("Enter item ID to give feedback on: ", (itemId) => {
      const id = parseInt(itemId);

      socket.emit("checkFoodItemExistence", id, (exists: boolean) => {
        if (exists) {
          rl.question("Enter your comment: ", (comment) => {
            if (!isNaN(parseFloat(comment)) || comment.trim().length === 0) {
              console.log("Invalid comment. Please enter a valid string comment.");
              askForItemId(); // Ask for item ID again
              return;
            }

            rl.question("Enter your rating (1-5): ", (ratingInput) => {
              const rating = parseInt(ratingInput);

              if (isNaN(rating) || rating < 1 || rating > 5) {
                console.log("Invalid rating. Please enter a number between 1 and 5.");
                askForItemId(); // Ask for item ID again
                return;
              }

              socket.emit(
                "giveFeedback",
                {
                  itemId: parseInt(itemId),
                  comment: comment.trim(),
                  rating,
                },
                (response: any) => {
                  console.log(response);
                  promptUser("employee");
                }
              );
            });
          });
        } else {
          console.log(`Menu item with ID ${itemId} does not exist. Please enter a valid item ID.`);
          askForItemId(); // Ask for item ID again
        }
      });
    });
  }

  askForItemId(); // Start asking for item ID
}

function getRolloutItems() {
  socket.emit("getRolloutItems", loggedInUser, (response: any) => {
    console.log(response);
    if (response.message === 'Chef has not rolled out any items yet.') {
      console.log(response.message); // Log the message received
      promptUser("employee");
      return; 
    }
    if (response.status === 'printMessage') {
      if (loggedInUser) {
        voteTomorrowFood(loggedInUser.name);
      } else {
        console.log("User not logged in");
        promptUser("employee");
      }
    } else if (response.status === 'error') {
      console.error("Error getting rollout items:", response.message);
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

    if (response.discardedItems.length) {
      console.log('Please select the menu items you want to provide detailed feedback on (separate multiple items with commas):');

      const selectedItems = await askQuestion('Enter item names:');
      const selectedItemsArray = selectedItems.split(',').map(item => item.trim().toLowerCase());

      for (const item of response.discardedItems) {
        if (selectedItemsArray.includes(item.item_name.toLowerCase())) {
          const feedbackExists = await checkIfFeedbackExists(item.item_name, loggedInUser?.employeeId);
          if (feedbackExists) {
            console.log(`You have already given feedback for ${item.item_name}.`);
          } else {
            const question1 = `What you did not like about ${item.item_name}?`;
            const question2 = `How would you like ${item.item_name} to taste?`;
            const question3 = `Share your mom's recipe if you want.`;

            const inputQ1 = await askQuestion(question1);
            const inputQ2 = await askQuestion(question2);
            const inputQ3 = await askQuestion(question3);

            socket.emit(
              'saveDetailedFeedback',
              item.item_name,
              loggedInUser?.employeeId,
              [question1, question2, question3],
              [inputQ1, inputQ2, inputQ3],
              (response: any) => {
                // Handle response if needed
              }
            );
          }
        }
      }

      console.log("\nYour feedback has been recorded successfully.\n");
      promptUser("employee");
    } else {
      console.log("Chef has not asked for detailed feedback on any menu item.");
      promptUser("employee");
    }
  });
}

function checkIfFeedbackExists(itemName: string, employeeId: any): Promise<boolean> {
  return new Promise((resolve) => {
    socket.emit('checkFeedbackExists', itemName, employeeId, (exists: boolean) => {
      resolve(exists);
    });
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
