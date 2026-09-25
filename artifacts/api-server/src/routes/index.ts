import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import profilesRouter from "./profiles";
import recurringEntriesRouter from "./recurring-entries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(profilesRouter);
router.use(recurringEntriesRouter);

export default router;
