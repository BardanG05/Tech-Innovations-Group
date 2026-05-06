const express = require('express');
const router = express.Router();

router.get("/api/faults", (req, res) => {
    // Gets all fault reports from db
});

router.POST("/api/faults", (req,res ) =>{
 //recieve new fault data from the app/frontend, then stores it 
});

router.PATCH("/api/faults/:id", (req,res) => {
 // Update fault status/servierty/description
});
