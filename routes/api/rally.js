const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//const keys = process.env;//const keys = require('../../config/keys');
const passport = require('passport');

//Import rally Validation
const validateRallyInput = require('../../validation/rallies');

//Load input validation
// const validateCreationInput = require('../../validation/creation');

//Load rally model
const Rally = require('../../models/Rally');
//Load user model
const User = require('../../models/User');

// @route    GET api/rally/test
// @desc     Test rally route
// @access   Public
// router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    //       newRally.save()
		// 	.then(rally => res.json(rally))
		// 	.catch(err => console.log(err));
    //     }
    // });
// })


// @route    GET api/rally/current
// @desc     Return current rally
// @access   Private
// router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
// 	res.json({
//     	name: req.rally.name,
//     	owners: req.rally.owners,
//     	members: req.rally.members,
//     	dateExpires: req.rally.dateExpires
//     });
// })

// @route    GET api/rally
// @desc     Return user rallies
// @access   Private
router.post('/get', passport.authenticate('jwt', { session: false }), (req, res) => {


  const errors = {};
  //console.log("user: ", req.body.id);
	Rally.find({ members: req.body.id})

		.then(rally => {
			if(rally.owners===[]) {

        console.log('There is no rally for this user');
				errors.norally = 'There is no rally for this user';
				return res.status(404).json(errors);
			}
			res.json(rally);
		})
		.catch(err => res.status(404).json(err));
});

// @route    GET api/rally/information
// @desc     Return rally information
// @access   Private
router.post('/information', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};

  console.log("body in GET info",req.body);
	Rally.findOne({ _id: req.body})
		.then(rally => {
			if(rally.owners===[]) {
				errors.norally = 'No rally was found';
				return res.status(404).json(errors);
			}
			res.json(rally);
		})
		.catch(err => res.status(404).json(err));
});

// @route    GET api/rally/rallyID/:rallyID
// @desc     Return a rally event page
// @access   Private
router.get('/rallyID/:rallyID', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
    //console.log("request params: ", req.params.rallyID);
	Rally.findOne({ _id: req.params.rallyID})
		.then(rally => {
			if(rally.owners===[]) {
				errors.norally = 'This Rally cannot be found';
				return res.status(404).json(errors);
			}
			res.json(rally);
		})
		.catch(err => res.status(404).json(err));
});

// @route    POST api/rally/create
// @desc     Create user rally
// @access   Private
// route through which Rally Creation UI form connects to DB
router.post('/create', passport.authenticate('jwt', { session: false }), (req, res) => {

    //console.log("inside post")
	  // const {errors, isValid} = validateRallyInput(req.body);
    //
    // if(!isValid){
    //     return res.status(400).json(errors);
    // }
	  // //gets the token
	  // const usertoken = req.headers.authorization;
	  // const token = usertoken.split(' ');
	  // const decoded = jwt.verify(token[1], 'secret');
    //
	  // //sets the rally fields to be created
	  // const rallyFields = {};
	  // rallyFields.owners = [];
    //
    //
    // // add the user creating the rally to the owners array
    // rallyFields.owners.push(req.user.id);
    //
	  // if(req.body.name) rallyFields.name = req.body.name;
	  // rallyFields.members = [];
	  // rallyFields.members.push(req.user.id);//body.owners);
    // //rallyFields.owners.push(req.user.id);//body.owners);
    // rallyFields.restrictions = {};
    // //if(req.body.displayRestrictions) rallyFields.displayRestrictions = req.body.displayRestrictions;
    // if(req.body.duration) rallyFields.duration = req.body.duration;
    // if(req.body.earliestTime) rallyFields.restrictions.earliestTime = req.body.earliestTime;
    // if(req.body.latestTime) rallyFields.restrictions.latestTime = req.body.latestTime;
    // if(req.body.location) rallyFields.restrictions.location = req.body.location;
    // if(req.body.timeOfWeek) rallyFields.restrictions.timeOfWeek = req.body.timeOfWeek;
    // if(req.body.locationSuggRadius) rallyFields.restrictions.locationSuggRadius = req.body.locationSuggRadius;
    // if(req.body.startDate) rallyFields.restrictions.startDate = req.body.startDate;
    // if(req.body.endDate) rallyFields.restrictions.endDate = req.body.endDate;
    //
    // //TODO: get MongoDB _id of the rally and push it into the user's rally array
    // //create a new rally
	  // new Rally(rallyFields).save().then(rally => res.json(rally));
    // req.user.rallies.push(res.id);




   const {errors, isValid} = validateRallyInput(req.body);

   if(!isValid){
       return res.status(400).json(errors);
   }
      //gets the token
      const usertoken = req.headers.authorization;
      const token = usertoken.split(' ');
      const decoded = jwt.verify(token[1], 'secret');

      //checks if the id from the jwt and the owner of the rally id matches
      // if(decoded.id!==req.body.owners ) {
      //     errors.nologin = 'Please log in.';
      //     return res.status(404).json(errors);
      // }

      //sets the rally fields to be created
      const rallyFields = {};
      rallyFields.owners = [];
      rallyFields.voting = {};
      rallyFields.voting.locations = new Map();
      if(req.body.locations) rallyFields.voting.locations.set(req.body.locations, 0);
      // rallyFields.owners.push(req.body.owners);
     rallyFields.owners.push(req.user.id);
      if(req.body.name) rallyFields.name = req.body.name;
      rallyFields.members = [];

      //TODO: put array of members from form into this array
      rallyFields.members.push(req.user.id);
      rallyFields.restrictions = {};
      //if(req.body.displayRestrictions) rallyFields.displayRestrictions = req.body.displayRestrictions;
      if(req.body.duration) rallyFields.duration = req.body.duration;
      if(req.body.earliestTime) rallyFields.restrictions.earliestTime = req.body.earliestTime;
      if(req.body.latestTime) rallyFields.restrictions.latestTime = req.body.latestTime;
      if(req.body.location) rallyFields.restrictions.location = req.body.location;
      if(req.body.timeOfWeek) rallyFields.restrictions.timeOfWeek = req.body.timeOfWeek;
      if(req.body.locationSuggRadius) rallyFields.restrictions.locationSuggRadius = req.body.locationSuggRadius;


     //create a new rally
      new Rally(rallyFields).save().then(rally => res.json(rally));

});

// @route    POST api/rally/update
// @desc     Update user rally
// @access   Private
// this route is available through UI button on loaded rally page
router.post('/update', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	//gets the token
	const usertoken = req.headers.authorization;
	const token = usertoken.split(' ');
	const decoded = jwt.verify(token[1], 'secret');

	//checks if the id from the jwt and the owner of the rally id matches
	if(decoded.id!==req.body.owners ) {
		errors.nologin = 'Please log in.';
		return res.status(400).json(errors);
	}

	//find a rally to change based on id
	  Rally.findOne({ _id: req.body._id }).then(rally => {
	  	if (rally) {
	  		//set rally fields to be changed
	  		const rallyFields = {};
	  		if(req.body.name) rallyFields.name = req.body.name;
		  	if(!rally.owners.includes(req.body.owners)) {
		  		rallyFields.owners = rally.owners.slice();
		  		rallyFields.owners.push(req.body.owners);
		  		rallyFields.members.push(req.body.owners);
		  	}
		  	if(!rally.members.includes(req.body.members)) {
		  		rallyFields.members = rally.members.slice();
		  		rallyFields.members.push(req.body.members);
		  	}

			//find rally and update it
	  		Rally.findOneAndUpdate(
			{ _id: rally._id },
			{ $set: rallyFields },
			{ new: true }
			).then(rally => res.json(rally));
	  		rally => res.json(rally);

	  	} else {
	  		//throw an error that a rally with name does not exist
	  		errors.rallyexists = 'A rally with this name does not exist';
	  		return res.status(400).json(errors);
	  }
  	})

});

module.exports = router;
