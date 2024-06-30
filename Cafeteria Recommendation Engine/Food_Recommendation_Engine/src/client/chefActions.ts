import { response } from "express";
import { askQuestion, promptUser, rl } from "../utils/promptUtils";
import { loggedInUser, socket } from "./client";

export function handleChefChoice(choice: string) {
  switch (choice) {
    case "1":
      rl.question("Enter menu type: ", (menuType) => {
        rl.question("Enter the number of items to return: ", (size) => {
          socket.emit(
            "getFoodItemForNextDay",
            { menuType, returnItemListSize: parseInt(size) },
            (response: any) => {
              console.log("Recommended Items:", response.recommendedItems);
              rl.question(
                "Enter item IDs to select for next day (comma-separated): ",
                (selectedIds) => {
                  const itemIds = selectedIds
                    .split(",")
                    .map((id) => parseInt(id.trim()));
                  console.log("Selected item IDs: nitin", itemIds);
                  socket.emit("selectNextDayMenu", itemIds, (res: any) => {
                    console.log(res.message);
                    promptUser("chef");
                  });
                }
              );
            }
          );
        });
      });
      break;
    case "2":
      socket.emit("viewMonthlyFeedback", (response: any) => {
        console.log(response);
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
                console.log(
                  "Failed to fetch feedback or no feedback available."
                );
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
      rl.close();
      socket.close();
      console.log("Goodbye!");
      break;
    case "5":
      socket.emit("getRecommendation", (response: any) => {
        console.log(response);
        promptUser("chef");
      });

    case "6":
      socket.emit("getMenu", (response: any) => {
        console.table(response.menuItems);
        promptUser("chef");
      });
    case "7":
      socket.emit("getTopRecommendations", (response: any) => {
        console.log(response.items);
        if (loggedInUser) {
          rolloutFoodItems();
        } else {
          console.log("User not logged in");
          promptUser("chef");
        }
      });
      break;
      case "8":
        socket.emit("checkResponses", (response: any) => {
          console.log(response);
          promptUser("chef");
        });
    default:
      console.log("Invalid choice, please try again.");
      promptUser("chef");
      break;
  }
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
     socket.emit("rolloutFoodItem", mealTime, items );
  }
  console.log("Menu items rolled out successfully.\n");
  promptUser("chef");
}
