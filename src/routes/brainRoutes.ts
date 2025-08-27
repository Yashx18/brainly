import { Request, Response, Router } from "express";
import { z } from "zod";
import { LinkModel, ContentModel } from "../db";
import { authMiddleware } from "../middleware";
import { randomHash } from "../utils";

const brainRouter = Router();

const brainShareSchema = z.object({
  share: z.boolean(),
});

brainRouter.post(
  "/share",
  authMiddleware,
  async (req: Request, res: Response) => {
    const result = brainShareSchema.safeParse(req.body);

    if (!result.success) {
      return res.json({
        message: "Invalid input",
      });
    }
    // @ts-ignore
    const { share } = result.data;
    console.log(share);

    if (share) {
      const hash = randomHash(10);
      const link = await LinkModel.findOneAndUpdate(
        // @ts-ignore
        { userId: req.userId },
        { hash },
        { upsert: true, new: true }
      );

      console.log(link);
      

      res.json({
        hash: `/brain/${hash}`,
        message: "Link generated successfully.",
      });

      console.log(`/api/brain/${hash}`);
    } else {
      await LinkModel.deleteMany({
        // @ts-ignore
        userId: req.userId,
      });
      res.json({
        message: "Link removed successfully..",
      });
    }
  }
);

brainRouter.post("/:sharelink", async (req: Request, res: Response) => {
  const hash = req.params.sharelink;
  console.log(hash);

  const user = await LinkModel.findOne({
    hash,
  });

  const content = await ContentModel.find({
    userId: user?.userId,
  }).populate("userId", "username");

  res.json({
    info: content,
  });
});

export default brainRouter;
