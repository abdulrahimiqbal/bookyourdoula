import { Router, type IRouter } from "express";
import healthRouter from "./health";
import doulasRouter from "./doulas";
import reviewsRouter from "./reviews";
import bookingsRouter from "./bookings";
import dashboardRouter from "./dashboard";
import availabilityRouter from "./availability";
import stripeRouter from "./stripe";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(doulasRouter);
router.use(reviewsRouter);
router.use(bookingsRouter);
router.use(dashboardRouter);
router.use(availabilityRouter);
router.use(stripeRouter);
router.use(storageRouter);

export default router;
