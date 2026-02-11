// import multer from "multer";
// import path from "path";
// import fs from "fs";


// const uploadDir = "uploads/";
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename(req, file, cb) {
//     cb(
//       null,
//       `${Date.now()}-${file.originalname.replace(/\s+/g, "")}`
//     );
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
//     cb(null, true);
//   } else {
//     cb(new Error("Only images allowed"));
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
// });

// export default upload;



//cloudnary storage
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
