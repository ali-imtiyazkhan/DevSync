import { createUser } from "../modules/user/user.services";
import { Router } from "express";

const router: Router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await createUser(name, email, password);

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "User creation failed" });
  }
});

export default router;
