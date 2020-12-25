import auth from 'src/server/auth';

export default async function loginRefresh(req, res) {
  try {
    auth.clearCookies(res);

    return res.status(200).json({ error: false });
  } catch (e) {
    console.error(e);

    return res
      .status(400)
      .json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}
