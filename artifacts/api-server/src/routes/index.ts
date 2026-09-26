import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import transactionsRouter from "./transactions";
import profilesRouter from "./profiles";
import recurringEntriesRouter from "./recurring-entries";
import financialAccountsRouter from "./financial-accounts";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(transactionsRouter);
router.use(profilesRouter);
router.use(recurringEntriesRouter);
router.use(financialAccountsRouter);

export default router;
