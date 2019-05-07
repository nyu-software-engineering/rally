
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {google} = require('googleapis');
const jwt = require('jsonwebtoken');
//const keys = process.env;//const keys = require('../../config/keys');
const passport = require('passport');

const moment = require('moment');
moment().format();
const validateLoginInput = require('../../validation/login');


//Load rally model
const Rally = require('../../models/Rally');
//Load user model
const User = require('../../models/User');

// @route    GET api/rally
// @desc     Return user rallies
// @access   Private
router.post('/get', passport.authenticate('jwt', { session: false }), (req, res) => {


  const errors = {};
  //console.log("user: ", req.body.id);
	Rally.find({ members: req.body.id})
        // .sort('-date')
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

  //console.log("body in GET info",req.body);
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
    //console.log('in /myrally/api/rallyID');
    if(req.params.rallyID === "rally" || req.params.rallyID === "create-rally" || req.params.rallyID === "deleteAccount"){

        return res.json();
    }

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
   // const {errors, isValid} = validateRallyInput(req.body);
   // if(!isValid){
   //     return res.status(400).json(errors);
   // }
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

      rallyFields.confirmed = {};
      rallyFields.confirmed.date = null;
      rallyFields.confirmed.time = null;
      rallyFields.confirmed.location = null;


      rallyFields.owners = [];
      rallyFields.ownerNames = [];
      rallyFields.voting = {};
      rallyFields.voting.locations = new Map();
      rallyFields.timeSlot = new Map();
      if(req.body.locations) rallyFields.voting.locations.set(req.body.locations, 0);
      // rallyFields.owners.push(req.body.owners);
      rallyFields.owners.push(req.user.id);
      rallyFields.ownerNames.push(req.user.name);

      if(req.body.name) rallyFields.name = req.body.name;
      rallyFields.members = [];
      rallyFields.members.push(req.user.id);

      rallyFields.memberNames = [];
      rallyFields.memberNames.push(req.user.name);

      rallyFields.restrictions = {};
      //if(req.body.displayRestrictions) rallyFields.displayRestrictions = req.body.displayRestrictions;
      if(req.body.duration) rallyFields.duration = req.body.duration;
      if(req.body.earliestTime) rallyFields.restrictions.earliestTime = req.body.earliestTime;
      if(req.body.latestTime) rallyFields.restrictions.latestTime = req.body.latestTime;

      if(req.body.startDate) rallyFields.restrictions.startDate = req.body.startDate;
      if(req.body.endDate) rallyFields.restrictions.endDate = req.body.endDate;


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

	//find a rally to change based on id
	  Rally.findOne({ _id: req.body._id }).then(rally => {
	  	if (rally) {
	  		//set rally fields to be changed
				const rallyFields = {};
	  		if(req.body.name) rallyFields.name = req.body.name;
	  		rallyFields.members = rally.members.slice();
	  		if(!rally.members.includes(req.body.members) && !rally.members.includes(req.body.owners) && req.body.members!==undefined) {
					rallyFields.members.push(req.body.members);
		  	}
		  	if(!rally.owners.includes(req.body.owners) && req.body.owners !== undefined) {
					rallyFields.owners = rally.owners.slice();
		  		rallyFields.owners.push(req.body.owners);
		  		rallyFields.members.push(req.body.owners);
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
	  		errors.rallyexists = 'A rally with this id does not exist';
	  		return res.status(400).json(errors);
	  }

  	})
});


// This endpoint returns an organic auth URL (generated by Goog)
// that is attached to the "Sync Google Cal" button on the rally homepage
// Clicking this begins the process of authorizing your Google Account - Hassan AnD Christy
router.get('/google', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	//gets the token
	const usertoken = req.headers.authorization;
	const token = usertoken.split(' ');
	const decoded = jwt.verify(token[1], 'secret');

	const oauth2Client = new google.auth.OAuth2(
	  process.env.clientId,
	  process.env.clientSecret,
	  'http://localhost:5000/api/rally/google/redirect'
	);

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: JSON.stringify({jwtTok: token[1]})
	});

    //console.log(authorizeUrl);

	google.options({auth: oauth2Client});

	res.send(authorizeUrl);
});



// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get('/google/redirect', (req, res) => {
	const errors = {};


	//Parameters for creating oAuthClient
    const clientSecret = process.env.clientSecret;
	const clientId = process.env.clientId;
    const redirectUris =['http://localhost:5000/api/rally/google/redirect'];
    //console.log("state: ",JSON.parse(req.query.state));//from authurl

    //Use the bearer token to find user_id so that we can store calendars into databse.
    const {jwtTok} = JSON.parse(req.query.state);
    const decoded = jwt.verify(jwtTok, 'secret');
    const userId = decoded.id;

    //console.log("userid: ",userId);

    //Create oAutClient
	const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);

	//Authenticate
	google.options({auth: oauth2Client});

	//Get an access token using the code google sent us.
	oauth2Client.getToken(req.query.code, function (err, tokens) {

		// Now tokens contains an access_token and an optional refresh_token. Save them.
		if (!err) {
			oauth2Client.setCredentials(tokens);
			const authorizeUrl = oauth2Client.generateAuthUrl({
				access_type: 'offline',
				scope: ['https://www.googleapis.com/auth/calendar.readonly']
			});

			//Outh client set up, now implement basic google calendar call.
			const calendar = google.calendar({version: 'v3', oauth2Client});

			calendar.events.list({
				calendarId: 'primary',
				timeMin: (new Date()).toISOString(),
				maxResults: 60,
				singleEvents: true,
				orderBy: 'startTime',
			}, (err, res) => {
				if (err) return console.log('The API returned an error: ' + err);
				const events = res.data.items;
				if (events.length) {
					events.map((event, i) => {
						const start = event.start.dateTime || event.start.date;
						const end = event.end.dateTime || event.end.date;

                        //TODO Ask Professor - Refer back to User.js in Models
						User.findOneAndUpdate(
							{_id: userId},
							{ $set: {
								   calendar: {
										 startTIme: start,
										 endTime: end
									 }
								}
							}, (err, docs) => { // callback
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log(docs);
                                }

                            });
						console.log(`${start} - ${end}`);
					})

				}
				else {
					console.log('No upcoming events found.');
				}
			}); // end of calendar.events.list
            // TODO: PUT X-COMPARE FUNCTION HERE
		} else {
			console.log(err);
		}
	});

	res.send('<div><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css"><script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script><style>h1 {text-align:center;}p {text-align:center;}</style><div><center><h1>Thank you!</h1> <p>You may now close this page and return to Rally</p></a></center></div></div>');
});


// @route    POST api/rally/addMembers
// @desc     Update user rally
// @access   Private
// this route is available through an email
router.post('/addMembers', passport.authenticate('jwt', {session: false}), (req, res) => {
  const errors = {};
  // gets the token
  const usertoken = req.headers.authorization;
  const token = usertoken.split(' ');
  const decoded = jwt.verify(token[1], 'secret');

  // checks if the id from the jwt and the owner of the rally id matches
  // if(decoded.id!==req.body.user ) {
  // 	errors.nologin = 'Please log in.';
  // 	return res.status(400).json(errors);
  // }
  User.findOne({email: req.body.email}).then((user) => {
	  if (user) {
		  // find a rally to change based on id
		  Rally.findOne({_id: req.body._id}).then((rally) => {
		  	if (rally) {
		  		// set rally fields to be changed
		      const rallyFields = {}
		  		rallyFields.members = rally.members.slice();
		  		if (!rally.members.includes(user._id) && !rally.members.includes(user._id)) {
		        rallyFields.members.push(user._id);
			  	}
			  	if (!rally.owners.includes(user._id)) {
		        rallyFields.owners = rally.owners.slice();
			  	rallyFields.owners.push(user._id);
			  	rallyFields.members.push(user._id);

			  	}

		      // find rally and update it
		  		Rally.findOneAndUpdate(
		          {_id: rally._id},
		          {$set: rallyFields},
		          {new: true}
		      ).then((rally) => res.json(rally));
		  		(rally) => res.json(rally);
		  	} else {
		  		// throw an error that a rally with name does not exist
		  		errors.rallyexists = 'A rally with this id does not exist';
		  		return res.status(400).json(errors);
		    }
		  });
	  } else {
	  	errors.usersexists = 'Please create a rally account';
	  	return res.status(400).json(errors);
	  }
  	})
});

// @route    POST api/rally/inviteViaEmail
// @desc     Update user rally
// @access   Private
// Requires Authorization, _id (rallyId), userId, newMember (Member to be invite and added in database)
// this route is available through UI button on loaded rally page
router.post('/inviteViaEmail', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};

	//gets the token
	const usertoken = req.headers.authorization;
	const token = usertoken.split(' ');
	const decoded = jwt.verify(token[1], 'secret');

	//checks if the id from the jwt and the owner of the rally id matches
	if(decoded.id!==req.body.user ) {
		errors.nologin = 'Please log in.';
		return res.status(400).json(errors);
	}

	else {
		//Message to be sent
		const output = `
			<p>You have a new contact request</p>
			<h3>Contact Details</h3>

			<h3>Message</h3>
			<p>"Hey, you have been invited for a rally. Clink <a href="localhost:3000">here</a> to join it!!! "</p>
		`;

		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
					user: process.env.rallyEmail, // generated ethereal user
					pass: process.env.rallyPassword  // generated ethereal password
			}
		});

		// setup email data with unicode symbols
		let mailOptions = {
				from: 'rally.agile.info@gmail.com', // sender address
				to: req.body.newMember, // list of receivers
				subject: 'New Rally By Your Friends!!', // Subject line
				text: 'Hello world?', // plain text body
				html: output // html body
		};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
						return console.log(error);
				}
				console.log('Message sent: %s', info.messageId);
				console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		});

		//find rally and add the newMember in database.
		Rally.findByIdAndUpdate(
			{ _id: rally._id },
			{ $push: {members: req.body.newMember} },
			{ new: true }
			).then(rally => res.json(rally));
	}
});


// @route    POST api/rally/addLocations
// @desc     Update user rally by adding locations
// @access   Private
// this route is available through UI button on loaded rally page
router.post('/addLocations', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	//gets the token
	const usertoken = req.headers.authorization;
	const token = usertoken.split(' ');
	const decoded = jwt.verify(token[1], 'secret');

	//checks if the id from the jwt and the owner of the rally id matches
	// if(decoded.id!==req.body.user ) {
	// 	errors.nologin = 'Please log in.';
	// 	return res.status(400).json(errors);
	// }

	//find a rally to change based on id
	  Rally.findOne({ _id: req.body._id })
        .then(rally => {
	  	    if (rally) {
				//set rally fields to be changed
				//console.log("locations map: ",rally.voting.locations === null);

                // Make a placeholder object to put poll updates
				const rallyFields = {};
				rallyFields.voting={};
				rallyFields.voting.locations= new Map();



                if(rally.voting.locations !== null){
                    console.log("type: ",typeof rally.voting.locations);
                    console.log("locations map not null");
                    // "it" is an iterator of the Map entries
                    if(rally.voting.locations.size > 0){

                        console.log("locations map not empty");
                        let it = rally.voting.locations.entries();
        				let result = it.next();

                        //this while populates the locations map with the current locations
        				while (!result.done) {
        					console.log(result.value); // 1 3 5 7 9
        					rallyFields.voting.locations.set(result.value[0],result.value[1]);
        					result = it.next();

        				}
                    }

                    //If the location poll array is nonempty but doesnt already have the locations, add it
    		  	    if(!rally.voting.locations.has(req.body.locations) && req.body.locations!==null) {
        				//	rallyFields.voting.locations = rally.voting.locations.slice();

                        console.log("setting a location vote");
        		  		rallyFields.voting.locations.set(req.body.locations,0);
    				}

                    //find rally and update it
        	  		Rally.findOneAndUpdate(
        			{ _id: rally._id },
        			{ $set: rallyFields },
        			{ new: true }
        			).then(rally => res.json(rally));
        	  		rally => res.json(rally);

                }else{
                    console.log("this rally does not have rally.voting.locations map");
                    errors.nolocations = 'this rally does not have rally.voting.locations map';
                }

    	  	} else {
    	  		//throw an error that a rally with name does not exist
    	  		errors.rallyexists = 'A rally with this id does not exist';
    	  		return res.status(400).json(errors);
	        }
  	    })
        .catch(err => console.log(err));

});

// @route    POST api/addVotes
// @desc     Update user rally by adding votes to a location
// @access   Private
// this route is available through UI button on loaded rally page
router.post('/addVotes', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	//gets the token
	const usertoken = req.headers.authorization;
	const token = usertoken.split(' ');
	const decoded = jwt.verify(token[1], 'secret');

	//find a rally to change based on id
	  Rally.findOne({ _id: req.body._id }).then(rally => {
          console.log("rally addvotes", rally)
	  	if (rally) {

                if(req.body.hasVoted){
                    errors.hasVoted = 'Sorry, you may only vote once!';
                    return res.status(400).json(errors);
                }else{
                    //set rally fields to be changed
    				//console.log(rally.voting.locations)
    				const rallyFields = {};
    				rallyFields.voting={};
    				rallyFields.voting.locations= new Map();
    				let it=rally.voting.locations.entries();
    				let result = it.next();
    				//this while populates the locations map with the current locations
    				while (!result.done) {
    					//console.log(result.value); // 1 3 5 7 9
    					rallyFields.voting.locations.set(result.value[0],result.value[1]);
    					result = it.next();

    				 }
    				//adds vote to specified location
    				//console.log("HELLO");
    		  	    if(rally.voting.locations.has(req.body.location) && req.body.location!==null) {
    				//	rallyFields.voting.locations = rally.voting.locations.slice();
    					// rallyFields.voting.locations.set(req.body.locations,0);
    					//console.log("HI",req.body.location)
    					rallyFields.voting.locations.set(req.body.location, rallyFields.voting.locations.get(req.body.location)+1);
    				}

    			//find rally and update it
    	  		Rally.findOneAndUpdate(
    			{ _id: rally._id },
    			{ $set: rallyFields },
    			{ new: true }
    			).then(rally => res.json(rally));
    	  		rally => res.json(rally);
                }


	  	} else {
	  		//throw an error that a rally with name does not exist
	  		errors.rallyexists = 'A rally with this id does not exist';
	  		return res.status(400).json(errors);
	  }
  	})

});

// @route    GET api/rally
// @desc     Return locations associated with voting in a Rally
// @access   Private
router.post('/getLocations', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};


	Rally.findOne({ _id: req.body._id}).then(rally => {
		if (rally) {
            if(rally.voting.locations){
                if(rally.voting.locations.size > 0){

                    //console.log("entries: ",Array.from(rally.voting.locations.entries()))
        			res.json(Array.from(rally.voting.locations.entries()));
                }
            }else{
                //console.log("rally.voting.locations does not exist (/getLocations)")
                errors.doesntexist = "locations doesnt exist"
            }

		}else{
            console.log("rally does not exist (/getLocations)");
        }

	})
	.catch(err => res.status(404).json(err));


});

// @route    GET api/rally/returnCompare
// @desc     Return top 5 timeslots
// @access   Private
router.get('/returnCompare', passport.authenticate('jwt', { session: false }), (req, res) => {
    Rally.findOne({ _id: req.body.id }).then(rally => {
        if (rally) {
            //console.log("in returncompare")
            let bestTimes = [];
            let discrepency = 0;
            while (bestTimes.length < 5) {
                for (let pair of rally.timeSlot) {
                    if (pair[1] == discrepency && bestTimes.length < 5) {
                        bestTimes.push(pair);
                    }
                }
                discrepency++;
            }
            res.json(bestTimes)
        }
    }).catch(err => res.status(400).json(err));
});

// @route    GET api/rally/crossCompare
// @desc     Compare all the calendars of the members of a Rally and push the comparison to the database
// @access   Private
router.post('/crossCompare', passport.authenticate('jwt', { session: false }), (req, res) => {
    //find rally based on id
    Rally.findOne({ _id: req.body.id }).then(rally => {
        //database for each possible time slot
        var timeslotDatabase = new Map();
        //get the calendar of each member
            User.find({ _id: rally.members }).then(users => {
                //find the latest time for an event in all the user calendars
                var latestTime = moment();
                for (let user of users) {
                    if (user.calendar.length > 0 && !((moment(user.calendar[user.calendar.length-1].startTime)).isBefore(latestTime))) {
                        latestTime = moment(user.calendar[user.calendar.length-1].startTime);
                    }
                }

                //add time slots for every day from the current date to the latest time based on the duration of the rally
                for (var m = moment(); m.diff(latestTime, 'days') <= 0; m.add(1, 'days')) {
                      for (var kk = 8; kk + rally.duration <= 24; kk++) {
                        timeslotDatabase.set(m.format('YYYY-MM-DD') + ' ' + kk + '-' + (kk+rally.duration), 0);
                    }
                }

                //find the time slots that overlap with the user calendar and increment the value of discrepency counter
                for (let user of users) {
                    for (var jj = 0; jj < user.calendar.length; jj++) {
                        for (let pair of timeslotDatabase) {
                            var allTimes = pair[0].split(/[\s-]+/)
                            if (moment(user.calendar[jj].startTime).format('YYYY') == allTimes[0] && moment(user.calendar[jj].startTime).format('MM') == allTimes[1] && moment(user.calendar[jj].startTime).format('DD') == allTimes[2]) {
                                if (parseInt(moment(user.calendar[jj].startTime).format('HH')) >= parseInt(allTimes[3]) && parseInt(moment(user.calendar[jj].startTime).format('HH')) <= parseInt(allTimes[4])) {
                                    timeslotDatabase.set(pair[0], (timeslotDatabase.get(pair[0])+1));
                                }
                                else if (parseInt(moment(user.calendar[jj].endTime).format('HH')) >= parseInt(allTimes[3]) && parseInt(moment(user.calendar[jj].endTime).format('HH')) <= parseInt(allTimes[4])) {
                                    timeslotDatabase.set(pair[0], (timeslotDatabase.get(pair[0])+1));
                                }
                            }
                        }
                    }
                }
                rally.update({ $set: {timeSlot: timeslotDatabase} }).then(res.json(rally));
            })
    });
});

// @route    POST api/rally/confirmRally
// @desc     Confirm Rally details
// @access   Private
// this route is available through UI button on loaded rally page
router.post('/confirm', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	//gets the token
	const usertoken = req.headers.authorization;
	const token = usertoken.split(' ');
	const decoded = jwt.verify(token[1], 'secret');

    //console.log("rallyid confrim",req.body._id);
	//find a rally to change based on id
	  Rally.findOne({ _id: req.body._id }).then(rally => {

          //console.log("rally from post",rally);
	  	if (rally) {
	  		//set rally fields to be changed
			const rallyFields = {};
            rallyFields.confirmed = {};
            if(req.body.confirmed){
                console.log("request body has confirmed")
                const {date, time, location} = req.body.confirmed;
                rallyFields.confirmed.date = date;
                rallyFields.confirmed.time = time;
                rallyFields.confirmed.location = location;

            }

			//find rally and update it
	  		Rally.findOneAndUpdate(
			{ _id: rally._id },
			{ $set: rallyFields },
			{ new: true }
			).then(rally => res.json(rally));
	  		rally => res.json(rally);

	  	} else {
	  		errors.rallyexists = 'A rally with this id does not exist';
	  		return res.status(400).json(errors);
	  }
  	})
});



module.exports = router;
