import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Soup", "Drink", "Spicy", "Tradition", "Sweet", "Cake"],
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Food = mongoose.model("Food", foodSchema);
export default Food;
