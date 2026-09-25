import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import profilesRouter from "./profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(profilesRouter);

export default router;
