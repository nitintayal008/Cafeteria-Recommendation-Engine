import { socket } from "./client";
import { promptUser, rl } from "../utils/promptUtils";
import { MenuItem } from "../utils/types";

export function handleEmployeeChoice(choice: string) {
  switch (choice) {
    case "1":
      socket.emit("viewMenu", (response: any) => {
        const formattedMenuItems = response.menuItems.map((item: MenuItem) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          mealType: item.mealType,
          availability: item.availability ? "available" : "not available",
        }));
        console.table(formattedMenuItems);
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
            // Item does not exist, notify and prompt for valid ID
            console.log(`Menu item with ID ${itemId} does not exist.`);
            promptUser("employee");
          }
        });
      });
      break;
    case "3":
      socket.emit("nextDayMenu", (response: any) => {
        console.log(response);
        rl.question("PLease selce the food id in which you intrested", comment => {
          socket.emit("saveResponseForNextDay", comment, (response: any) => {
            console.log("you selected great food",response);
            promptUser("employee");
          });
        }
        )
      });
      break;
    case "4":
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