import Food from "../models/foodModel.js";
import cloudinary from "../config/cloudinary.js";
import { io } from "../server.js";


export const getFoods = async (req, res) => {
  try {
    const { category } = req.query;

    let foods;

    if (category && category !== "All") {
      foods = await Food.find({ category });
    } else {
      foods = await Food.find();
    }

    res.status(200).json({
      count: foods.length,
      foods,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const createFood = async (req, res) => {
  try {
    const { title, desc, price, category } = req.body;

    if (!title || !desc || !price || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "foods",
    });

    const food = await Food.create({
      title,
      desc,
      price,
      category,
      image: uploadResult.secure_url,
    });

    // REAL-TIME NOTIFICATION TO ALL USERS
    io.emit("newFood", {
      _id: food._id,
      title: food.title,
      desc: food.desc,
      image: food.image,
      price: food.price,
      category: food.category,
      createdAt: food.createdAt,
    });


    return res.status(201).json({
      message: "Food added successfully",
      food,
    });

  } catch (error) {
    console.error("Create food error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// export const searchFood = async (req, res) => {
//   try {
//     const { q } = req.query;

//     if (!q) {
//       return res.status(400).json({ foods: [] });
//     }

//     const foods = await Food.find({
//       $or: [
//         { title: { $regex: q, $options: "i" } },
//         { category: { $regex: q, $options: "i" } },
//         { price: isNaN(q) ? undefined : Number(q) }
//       ],
//     });

//     res.status(200).json({ foods });
//   } catch (error) {
//     res.status(500).json({ message: "Search failed" });
//   }
// };



export const searchFood = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({ foods: [] });
    }

    const foods = await Food.find({
      $or: [
        // title search
        { title: { $regex: q, $options: "i" } },

        // category search
        { category: { $regex: q, $options: "i" } },

        // 🔥 price partial search (number → string)
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$price" },
              regex: q,
            },
          },
        },
      ],
    });

    res.status(200).json({ foods });
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};
