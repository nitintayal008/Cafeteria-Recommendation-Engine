import { askQuestion, promptUser, rl } from "../server/utils/promptUtils";
import { MenuItem } from "../server/utils/types";
import { socket } from "./client";

export async function handleAdminChoice(choice: string) {
  switch (choice) {
    case "1":
      await addMenuItem();
      break;
    case "2":
      await updateMenuItem();
      break;
    case "3":
      await deleteMenuItem();
      break;
    case "4":
      viewMenu();
      break;
    case "5":
      viewMonthlyFeedback();
      break;
    case "6":
      rl.close();
      socket.close();
      console.log("Goodbye!");
      break;
    default:
      console.log("Invalid choice, please try again.");
      promptUser("admin");
      break;
  }
}

async function addMenuItem() {
  try {
    const name = await askQuestion("Enter item name: ");
    const price = await askQuestion("Enter item price: ");
    const mealType = await askQuestion("Enter meal type: ");
    const availability = await askQuestion("Is the item available (true/false): ");
    const foodType = await askQuestion("1) Select one - Vegetarian, Non Vegetarian, Eggetarian: ");
    const spiceLevel = await askQuestion("2) Select your spice level - High, Medium, Low: ");
    const cuisine = await askQuestion("3) Select your cuisine preference - North Indian, South Indian, Other: ");
    const sweetTooth = await askQuestion("4) Do you have a sweet tooth? (Yes/No): ");

    const menuItem = {
      name,
      price: parseFloat(price),
      mealType,
      availability: availability === "true",
    };
    
    const profileData = {
      foodType: foodType.trim(),
      spiceLevel: spiceLevel.trim(),
      cuisine: cuisine.trim(),
      sweetTooth: sweetTooth.trim().toLowerCase() === "yes"
    };

    socket.emit("addMenuItem", menuItem, profileData, (response: any) => {
      console.log(response);
      if(response.success == true){
        console.log("Item added sucessfully");
      }else{
        console.log("Error adding item , try adding again");
      }
      promptUser("admin");
    });
  } catch (error) {
    console.error("Error adding menu item:", error);
  }
}

async function updateMenuItem() {
  try {
    const id = await askQuestion("Enter item ID to update: ");
    const itemId = parseInt(id);

    socket.emit("checkFoodItemExistence", itemId, async (exists: boolean) => {
      if (exists) {
        const name = await askQuestion("Enter new item name: ");
        const price = await askQuestion("Enter new item price: ");
        const mealType = await askQuestion("Enter meal type: ");
        const availability = await askQuestion("Is the item available (true/false): ");

        const updatedItem = {
          id: itemId,
          name,
          price: parseFloat(price),
          mealType,
          availability: availability === "true",
        };

        socket.emit("updateMenuItem", updatedItem, (response: any) => {
          console.log(response);
          promptUser("admin");
        });
      } else {
        console.log(`Menu item with ID ${itemId} does not exist.`);
        promptUser("admin");
      }
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
  }
}

async function deleteMenuItem() {
  try {
    const id = await askQuestion("Enter item ID to delete: ");
    const itemId = parseInt(id);

    socket.emit("deleteMenuItem", itemId, (response: any) => {
      console.log(response);
      promptUser("admin");
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
  }
}

function viewMenu() {
  socket.emit("viewMenu", (response: any) => {
    if (response.success) {
      const formattedMenuItems = response.menuItems.map(
        (item: MenuItem) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          mealType: item.mealType,
          availability: item.availability ? "available" : "not available",
        })
      );
      console.table(formattedMenuItems);
    } else {
      console.log("Failed to retrieve menu items.");
    }
    promptUser("admin");
  });
}

function viewMonthlyFeedback() {
  socket.emit("viewMonthlyFeedback", (response: any) => {
    console.table(response.feedbackReport);
    promptUser("admin");
  });
}
