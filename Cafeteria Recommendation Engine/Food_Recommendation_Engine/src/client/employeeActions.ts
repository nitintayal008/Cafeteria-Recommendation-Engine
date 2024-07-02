// employeeActions.ts
import { socket, loggedInUser } from "./client";
import { promptUser, rl, askQuestion } from "../server/utils/promptUtils";
import { MenuItem } from "../server/utils/types";

export function handleEmployeeChoice(choice: string) {
  switch (choice) {
    case "1":
      updateProfile();
    break;
    case "2":
      socket.emit("getMenu", (response: any) => {
        console.table(response.menuItems);
        promptUser("employee");
      });
      break;
    case "3":
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
      break;
    case "4":
      socket.emit("getRolloutItems", (response: any) => {
        console.log(response);
        if (loggedInUser) {
          voteTomorrowFood(loggedInUser.name);
        } else {
          console.log("User not logged in");
          promptUser("employee");
        }
      });
      break;
    case '5':
      socket.emit("viewNotification", (response: any) => {
        console.table(response.notification);
        promptUser("employee");
      });
      break;
    case "6":
      socket.emit("viewDiscardedItems", (response: any) => {
        console.table(response.discardedItems);
        const  alreadyFeddbacked = socket.emit("checkFeedbackResponses", loggedInUser?.employeeId, (response: any)=>{
          return response;
        }); 
        if(!alreadyFeddbacked){
          answerDiscardItem(response.discardedItems);
        }
        else{
          console.log("You have already given feedback for the discarded items.");
          promptUser("employee");
        }
      });
      break;
    case "7":
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

async function voteTomorrowFood(username: string) {
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
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
  console.log('Your responses have been recorded successfully.\n');
  promptUser("employee");
}

async function answerDiscardItem(questions: string[]) {
  for (const question of questions) {
    let exists = "false";
    const answer = await askQuestion(`${question}`);
    await new Promise<void>((resolve) => {
      if(loggedInUser)
      socket.emit("saveSolution", question, answer, loggedInUser.employeeId, (result: string) => {
        exists = result;
        console.log(exists);
        resolve();
      });
    });
    console.log('Your response has been recorded successfully.\n');
  }
  promptUser("employee");
}

async function updateProfile() {
  try {
    console.log("Please answer these questions to know your preferences:");
    const dietaryPreference = await askQuestion("1) Please select one - Vegetarian, Non Vegetarian, Eggetarian: ");
    const spiceLevel = await askQuestion("2) Please select your spice level - High, Medium, Low: ");
    const cuisinePreference = await askQuestion("3) What do you prefer most - North Indian, South Indian, Other: ");
    const sweetTooth = await askQuestion("4) Do you have a sweet tooth - Yes, No: ");
    
    const profileData = {
      dietaryPreference: dietaryPreference.trim(),
      spiceLevel: spiceLevel.trim(),
      cuisinePreference: cuisinePreference.trim(),
      sweetTooth: sweetTooth.trim().toLowerCase() === "yes"
    };

    socket.emit("updateProfile", profileData, loggedInUser?.employeeId, (response: any) => {
      console.log(response.message);
    });
  } catch (error) {
    console.error("Error updating profile:", error);
  }
  setTimeout(() => {
    promptUser("employee");
  }, 200);
}

