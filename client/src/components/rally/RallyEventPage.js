import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getRallyByID, clearCurrentProfile, addLocations, getTimeslots } from '../../actions/profileActions';
import { Link } from 'react-router-dom';
import TextFieldGroup from '../common/TextFieldGroup';
import moment from 'moment';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
//import Poll from 'react-polls';

class RallyEventPage extends Component {

  constructor(props) {
      super(props);

      //component state: rally form fields
      this.state = {

        // Location suggestion state fields
        locationSuggestion: '',
        pollAnswers: [],
        pollAnswerMap: new Map(),
        // Member addition fields
        addMembers: '',

        incomingVoting: null,
        topTimeslots: null,
        rally: null
      }

      this.onChange = this.onChange.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
      this.handleVote = this.handleVote.bind(this);
      this.componentDidMount = this.componentDidMount.bind(this);

  }

  // Used for location submission
  onChange(e){
      this.setState({[e.target.name]: e.target.value});

      // Debug location suggesting
      console.log("location val: ",this.state.locationSuggestion);
  }

  onSubmit(e) {
      e.preventDefault();

      const {locationSuggestion, pollAnswers} = this.state;
      console.log("submitting: ", locationSuggestion);

      const toAdd = {
          locations: locationSuggestion,
          _id: this.props.rally.rallies._id
      }

      console.log("addLoc.loc: ",toAdd.locations);
      console.log("addLoc.id: ",toAdd._id);

      axios
          .post('/api/rally/addLocations', toAdd)
          .then(res => {
              // this.setState({
              //   pollAnswers: newPollAnswers
              // })
              console.log(res);
          })
          .catch(err => {
              console.log(err)
      });


  }
  componentWillUnmount() {
   this._ismounted = false;
  }

  componentWillReceiveProps(nextProps){

      if(nextProps.errors){
          this.setState({errors: nextProps.errors});
      }
      console.log("nextProps:", nextProps)

      if(nextProps.rally && !nextProps.rally.loading){
          if(nextProps.rally.rallies){
              const { voting, timeSlot } = nextProps.rally.rallies;
              console.log("timeSlot obj: ",timeSlot)
              this.setState({
                  incomingVoting: voting.locations,
                  topTimeslots: timeSlot,
                  rally: nextProps.rally
              })
          }
      }

      // if(nextProps.rally){
      //     if(nextProps.rally.rallies){
      //         if(nextProps.rally.rallies.voting){
      //             if(nextProps.rally.rallies.voting.locations){
      //                 this.setState({pollAnswers: nextProps.rally.rallies.voting.locations})
      //             }
      //         }
      //     }
      // }
//       console.log("willreceive rally: ", nextProps.rally);
//       if(!nextProps.rally.loading){
//         if(nextProps.rally.rallies){
//           // const newPollAnswers = pollAnswers.map(answer => {
//           //   if (answer.option === voteAnswer) answer.votes++
//           //   return answer
//           // })
//           console.log("this.props.rally: ",nextProps.rally.rallies);
//           if(nextProps.rally.rallies){
//               const { voting } = nextProps.rally.rallies;
//               console.log("in rally voting", voting);
//               console.log("in rally locations", voting.locations);
//               console.log("locations size", Object.keys(voting.locations).length);
//               if(Object.keys(voting.locations).length > 0){
//                   console.log("size greater than 0");
//                   // let iterator = nextProps.rally.rallies.voting.locations.entries();
//                   // for(let value of iterator){
//                   //     console.log("iterator: ",value);
//                   //
//                   // }

//                   console.log("b4 setstate: ",nextProps.rally.rallies.voting.locations);
//                   this.setState({
//                     pollAnswerMap: nextProps.rally.rallies.voting.locations
//                   })
//                   console.log("after setstate",this.state.pollAnswerMap);
//               }
//
//
//
// //------------------------------------------------
//               const data = {
//                   _id: nextProps.rally.rallies._id
//               }
//               console.log(data._id);
//               axios
//                   .post('/api/rally/getLocations', data)
//                   .then(res => {
//
//                       console.log("res: ",res.data)
//                       this.setState({
//
//                         //this router call returns Array.from(iterable)
//                         //result is array of {location, votes} pairs
//                         pollAnswer: res.data
//                       })
//                   })
//                   .catch(err => {
//                       console.log(err)
//               });
//           }

  }






  // Handling user vote
  // Increments the votes count of answer when the user votes
  handleVote(voteAnswer){


    const { pollAnswers } = this.state;
    console.log("poll answers: ",pollAnswers); // this is an array of {location, vote} pairs

    const data = {
        location: voteAnswer,
        id: this.props.rally.rallies._id
    }


    //iterate through locations and increment vote count where necessary
    const newPollAnswers = pollAnswers.map(answer => {
      if (answer.option === voteAnswer){
          answer.votes++;

          // set the poll answers to be the updated info
          //make axios call, on .then(set state)
          axios
              .post('/api/rally/addVotes', data)
              .then(res => {
                  this.setState({
                    pollAnswers: newPollAnswers
                  })
              })
              .catch(err => {
                  console.log(err)
          });
          return answer
      }
      this.setState({
        pollAnswers: newPollAnswers
      })
    })
  }

  // handleVote = voteAnswer => {
  //   const { pollAnswers } = this.state; //pollAnswers is an array
  //   const newPollAnswers = pollAnswers.map(answer => {
  //     if (answer.option === voteAnswer){
  //         answer.votes++;
  //         return answer;
  //     }
  //
  //   })
  //
  //   //instead of this, set the state as the res of the router request
  //   this.setState({
  //     pollAnswers: newPollAnswers
  //   })
  // }

  onMembersChange(e){

  }

  componentDidMount(){

    this.props.clearCurrentProfile();
    this.state.pollAnswers.push({option: 'Suggest locations below!', votes: 0});



    console.log("rally params: ",this.props.match.params);
    if(this.props.match.params.rallyID){
            this.props.getRallyByID(this.props.match.params.rallyID);
            console.log("rallyID: ", this.props.match.params.rallyID);

            this.props.getTimeslots(this.props.match.params.rallyID);
    }else{return;}


  }

  render() {

    const {loading} = this.props.rally;

    console.log("props rally",this.props.rally)
    console.log("userid: ",this.props.auth.user.id)

    const {incomingVoting, topTimeslots} = this.state;
    const {id} = this.props.auth.user;
    let ownerCog;
    if(this.props.rally && this.props.rally.rallies && this.props.rally.rallies.members){
        const {members} = this.props.rally.rallies;
        console.log("members len: ",members.length)
        for(let i = 0; i < members.length; i++){

            console.log("mem id: ", members[i], "userid:",id)
            if(members[i] == id){
                console.log("link state", this.state);
                ownerCog = (
                    <div>
                    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossOrigin="anonymous"/>


                    <Link to={{
                        state: {...this.state},
                        pathname:`/myrally/${this.props.rally.rallies._id}/confirm`
                    }}
                    className="btn btn-info" >
                      <i style={{marginRight: 10 }} className="fas fa-tasks"></i>
                    </Link>
                    </div>
                );
                break;
            }
        }
    }

    let topTimes;

    if(topTimeslots){

        let times = [];
        Object.keys(topTimeslots).forEach(function(key) {
          console.log("time entry:",key, topTimeslots[key]);
            times.push(key);
        });
        console.log("times array", times);
        topTimes = (
            <div>


                {times.slice(0,5).map((key, index) => (
                    <li key={index} className="list-group-item">
                        <small className="text-muted">{moment(key).format("dddd, MMMM Do YYYY, h:mm a")}</small>
                    </li>
                ))}


            </div>
        )
    }else{}

    let voting;
    if(incomingVoting){

        Object.keys(incomingVoting).forEach(function(key) {
          console.log("loc entry:",key, incomingVoting[key]);
          // <li key={index} className="list-group-item">
          //   <small className="text-muted">{person}</small>
          // </li>
        });


        // {this.props.rally.rallies.owners.slice().map((key, index) => (
        //   <small className="text-muted">{key}, </small>
        // ))}
    }else{
        voting = <h5>No locations have been suggested yet. Add a location below!</h5>
    }


    if( this.props.rally.rallies === null || loading ) {
      pageData = <h4>Loading...</h4>
    }else{

    }
    let pageData;
    if(this.props.rally.rallies && this.props.match.params.rallyID){



      // Display restrictions if they exist
      let restrictions;
      let restrictionData;
      if(this.props.rally.rallies.restrictions){

          restrictions = this.props.rally.rallies.restrictions;

          Object.keys(restrictions).map(function(key, index) {
            //console.log(restrictions[key], key);
          });

          restrictionData = (
            <div>
              <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossOrigin="anonymous"/>

              {restrictions.location ? <div><p>Predetermined Location: <b>{restrictions.location}</b></p></div> : null}

              {restrictions.startDate ? <div>
                  <div className="row">
                    <div className="col-md-1">
                      <i className="far fa-calendar-check"></i>
                    </div>
                    <div className="col-md-10">
                      <p>Date Range Start: <b>{moment(restrictions.startDate).format('MM-DD-YYYY')}</b></p>
                    </div>
                  </div>
              </div> : null}

              {restrictions.endDate ? <div>
                  <div className="row">
                    <div className="col-md-1">
                      <i className="far fa-calendar-check"></i>
                    </div>
                    <div className="col-md-10">
                      <p>Date Range End: <b>{moment(restrictions.endDate).format('MM-DD-YYYY')}</b></p>
                    </div>
                  </div>
              </div> : null}

              {restrictions.earliestTime ?
                <div>
                  <div className="row">
                    <div className="col-md-1">
                      <i className="far fa-clock"></i>
                    </div>
                    <div className="col-md-10">
                      <p>Earliest Start Time: <b>{moment(restrictions.earliestTime).format('HH:mm A')}</b></p>
                    </div>
                  </div>
                </div> : null}

              {restrictions.latestTime ? <div>
                  <div className="row">
                    <div className="col-md-1">
                      <i className="far fa-clock"></i>
                    </div>
                    <div className="col-md-10">
                      <p>Latest End Time: <b>{moment(restrictions.latestTime).format('HH:mm A')}</b></p>
                    </div>
                  </div>

              </div> : null}

              {restrictions.timeOfWeek ? <div><p>Only schedule on: <b>{restrictions.timeOfWeek}</b></p></div>:null}
            </div>
          )
      }else{ restrictionData = <h6>No restrictions set. Take the reigns!</h6>;}



      pageData = (

        <div>
          <h1 className="display-4">{this.props.rally.rallies.name}</h1>



            {this.props.rally.rallies.owners ?
                <div>
                  <div className="row">
                    <div className="col-md-5">
                      <h3 className="text-muted" style={{marginLeft: 10}}>Organizer: {this.props.rally.rallies.ownerNames.slice().map((key, index) => (
                        <font >{key} </font>
                    ))} <span className="badge badge-light">{ownerCog}</span></h3>

                    </div>
                  </div>
                </div> : <h6>no owner array</h6>}



          <div className="row">

            <div className="col-md-4">
              <div className="well">
                <div className="card card-body bg-light mb-3">
                  <h3>Details</h3>
                  <h5>Duration: ~ {this.props.rally.rallies.duration} hour(s)</h5>
                  <p>These are the scheduling details and restrictions we have from you so far.</p>
                  <hr></hr>
                  <h5>Restrictions:</h5>

                  {restrictionData}
                  <hr/>

                </div>
              </div>
            </div>


            <div className="col-md-8">

            <div className="row">
            <div className="col-md-12">
              <div className="well">
                <div className="card card-body bg-light mb-3">
                <h5>Best Time Slots:</h5>
                <div><small className="text-muted">The times below maximize member attendance.</small></div>

                {topTimes ?
                <div>
                  {topTimes}
                </div> : <div><h5>None of this Rally's members have synced their Google calendar yet.</h5></div> }


                </div>
                </div>
                </div>
            </div>



              <div className="row">

                <div className="col-md-6">
                  <div className="well">
                    <div className="card card-body bg-light mb-3">
                      <h3>Location Voting</h3>
                      <p>Vote on a location or suggest your own!</p>

                      <TextFieldGroup
                                placeholder="Location suggestion"
                                name="locationSuggestion"
                                type="locationSuggestion"
                                value={this.state.locationSuggestion}
                                onChange={this.onChange}
                                info="If you do not see an option you like, submit a suggestion then vote on it in the poll above!"
                      />

                      <button type="button" onClick={this.onSubmit} className="btn btn-info">
                        <span>Submit Suggestion</span>
                      </button>

                    </div>
                  </div>
                </div>


                <div className="col-md-6">
                  <div className="well">
                    <div className="card card-body bg-light mb-3">
                      <h3>Members</h3>
                      <p fontSize="20px">Those who can attend the number one time slot are italicized.</p>




                      {this.props.rally.rallies.members
                          ? <div>
                          {this.props.rally.rallies.memberNames.slice().map((person, index) => (
                            <li key={index} className="list-group-item">
                              <font className="text-muted">{person}</font>
                            </li>
                          ))}
                          </div> : <h6>no member array</h6>}
                      <br></br>

                      <TextFieldGroup
                                placeholder="Add members by email"
                                name="addMembers"
                                type="addMembers"
                                value={this.state.addMembers}
                                onChange={this.onMembersChange}
                                info="Enter emails separated by commas."
                      />

                      <button type="button" onClick={this.onMemberSubmit} className="btn btn-info">
                        <span>Invite</span>
                      </button>

                    </div>
                  </div>
                </div>



              </div>


            </div>
          </div>
        </div>
      )
      //const { duration, name, members, owners, restrictions } = rallies;
    }else{
      pageData = null
    }


    let confirmedState;

    if(this.props.rally && this.props.rally.rallies){
        //const {confirmed} = this.props.rally.rallies;
        console.log("check:",this.props.rally.rallies.confirmed);
        if(this.props.rally.rallies.confirmed){
            const { date, time, location } = this.props.rally.rallies.confirmed;

            //------
            confirmedState = (
                <div>
                    <div>
                    <h1 className="display-4">{this.props.rally.rallies.name}</h1>
                    <div className="card card-body bg-light mb-12">
                        {this.props.rally.rallies.owners ?
                        <div>
                            <div className="row">
                                <div className="col-md-2">
                                    <h5>Organizers</h5>
                                </div>
                                <div className="col-md-10">
                                  {this.props.rally.rallies.owners.slice().map((key, index) => (
                                    <small className="text-muted">{key}, </small>
                                  ))}
                                </div>
                            </div>
                        </div> : <h6>no owner array</h6>}
                    </div>
                    <br></br>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="well">
                                <div className="card card-body bg-light mb-3">
                                    <h3>Confirmed Details</h3>
                                    <h5>Duration: ~ {this.props.rally.rallies.duration} hour(s)</h5>
                                    <p>These are the scheduling details confirmed by the organizer.</p>
                                    <div className="hr"/>
                                        <br></br>
                                        <h5>Date: {date}</h5>
                                        <h5>Time: {time}</h5>
                                        <h5>Location: {location}</h5>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="well">
                                <div className="card card-body bg-light mb-3">
                                    <h3>Members</h3>
                                    <p fontSize="20px">Those who can attend the number one time slot are italicized.</p>
                                    {this.props.rally.rallies.members ?
                                    <div>
                                        {this.props.rally.rallies.members.slice().map((person, index) => (
                                        <li key={index} className="list-group-item">
                                            <small className="text-muted">{person}</small>
                                        </li>
                                        ))}
                                    </div> : <h6>no member array</h6>}
                                    <br></br>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            //-------
            if(date !== null && time !== null && location !== null){
                pageData = confirmedState;
            }

        }
    }



    return (
      <div className="rallies">
          {pageData}
      </div>
    );
  }
}

RallyEventPage.propTypes = {
  getRallyByID: PropTypes.func.isRequired,
  clearCurrentProfile: PropTypes.func.isRequired,
  getTimeslots: PropTypes.func.isRequired,
  //addLocations: PropTypes.func.isRequired,
  rally: PropTypes.object.isRequired,

  //locationSuggestion: PropTypes.object.isRequired,
  //
  //pollAnswers: PropTypes.object.isRequired
  //auth: PropTypes.object.isRequired

}

const mapStateToProps = state => ({

  rally: state.rally,

  //locationSuggestion: state.locationSuggestion,
  pollAnswers: state.pollAnswers,
  incomingVoting: state.incomingVoting,

  //topTimeslots: state.
  auth: state.auth
})

// connects the props of the state returned from getRallyByID
// and those in the component, then exports the component
// with these props and state
export default connect(mapStateToProps, {getRallyByID, getTimeslots,addLocations, clearCurrentProfile})(withRouter(RallyEventPage));
