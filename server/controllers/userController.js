export async function getOnlineCount(req, res) {
  const io = req.app.locals.io;
  const count = io?.of("/")?.sockets?.size || 0;

  return res.json({ count });
}
