// employeeActions.ts
import { socket, loggedInUser } from "./client";
import { promptUser, rl, askQuestion } from "../server/utils/promptUtils";
import { MenuItem } from "../server/utils/types";

export function handleEmployeeChoice(choice: string) {
  switch (choice) {
    case "1":
      // socket.emit("viewMenu", (response: any) => {
      //   const formattedMenuItems = response.menuItems.map((item: MenuItem) => ({
      //     id: item.id,
      //     name: item.name,
      //     price: item.price,
      //     mealType: item.mealType,
      //     availability: item.availability ? "available" : "not available",
      //   }));
      //   console.table(formattedMenuItems);
      //   promptUser("employee");
      // });
      socket.emit("getMenu", (response: any) => {
        console.table(response.menuItems);
        promptUser("employee");
      });
      break;
    case "2":
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
    case "3":
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
    case '4':
      socket.emit("viewNotification", (response: any) => {
        console.table(response.notification);
        promptUser("employee");
      });
      break;
    case "5":
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
