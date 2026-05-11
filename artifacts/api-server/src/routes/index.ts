import { Router, type IRouter } from "express";
import healthRouter from "./health";
import doulasRouter from "./doulas";
import reviewsRouter from "./reviews";
import bookingsRouter from "./bookings";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(doulasRouter);
router.use(reviewsRouter);
router.use(bookingsRouter);
router.use(dashboardRouter);

export default router;
