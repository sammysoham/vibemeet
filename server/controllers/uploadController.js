export async function uploadChatMedia(req, res) {
  if (!req.user.isPremium) {
    return res
      .status(403)
      .json({ error: "Premium is required to send images or videos." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";

  return res.status(201).json({
    url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    mediaType,
    fileName: req.file.originalname,
  });
}
