const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/Menu", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const menuSchema = new mongoose.Schema(
  {
    name: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;



app.use(bodyParser.json());

// Create Menu
app.post("/create/menu", async (req, res) => {
  const data = req.body;
  const response = await Menu.create(data);

  // for sample use

  // const homeMenu = await Menu.create({ name: 'Home' });

  // const productsMenu = await Menu.create({ name: 'Products', parent: homeMenu._id });
  // const electronicsMenu = await Menu.create({ name: 'Electronics', parent: productsMenu._id });
  // const smartphonesMenu = await Menu.create({ name: 'Smartphones', parent: electronicsMenu._id });

  // const clothingMenu = await Menu.create({ name: 'Clothing', parent: productsMenu._id });
  // const mensClothingMenu = await Menu.create({ name: "Men's Clothing", parent: clothingMenu._id });

  console.log('Menus created successfully');
  res.status(200).json({ code: 200,response });
});

const getmenuTree = async (parentId = null) => {
  const menus = await Menu.find({ parentId });
  const menuTree = [];

  for (const menu of menus) {
    const submenus = await getmenuTree(menu._id);

    const formattedmenu = {
      id: menu._id,
      name: menu.name,
      parentName: menu.parent,
    };

    // Check if the menu has a parent
    if (menu.parent) {
      // Include parent information
      const parentMenu = await Menu.findById(menu.parent);
      formattedmenu.parentName = {
        id: parentMenu._id,
        name: parentMenu.name,
      };
    }

    if (submenus.length > 0) {
      formattedmenu.subCate = submenus;
    }

    menuTree.push(formattedmenu);
  }

  return menuTree;
};

// Read Menus
app.get("/get/all/menus", async (req, res) => {
  const menuTree = await getmenuTree();
  const response = JSON.parse(JSON.stringify(menuTree, null, 2))
  res.status(200).json({ code: 200, response });
});


// Update Menu by ID
app.put("/update/menu/:id", async (req, res) => {
  try {
    const menuId = req.params.id;
    const data = req.body;
    const menu = await Menu.findByIdAndUpdate(menuId, data, {
      new: true,
    }).exec();
    if (!menu) {
      res.status(404).json({ code: 404, message: "Menu not found" });
      return;
    }
    res.status(200).json({ code: 200, menu });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

// Delete User by ID
app.delete("/delete/menu/:id", async (req, res) => {
  try {
    const menuId = req.params.id;
    const menu = await Menu.findByIdAndDelete(menuId).exec();
    if (!menu) {
      res.status(404).json({ code: 404, message: "Menu not found" });
      return;
    }
    res.json({ code: 200, message: "Menu deleted successfully" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
