import express from "express";

import {

    addTrackingEvent,
    getShipmentTracking,
    deleteTrackingEvent

} from "../controller/shipmentTrakingController.js";


const router =
    express.Router();


// ADD TRACKING
router.post(

    "/shipment/:shipmentId",

    addTrackingEvent

);


// GET TRACKING
router.get(

    "/shipment/:shipmentId",

    getShipmentTracking

);


// DELETE TRACKING
router.delete(

    "/:id",

    deleteTrackingEvent

);


export default router;