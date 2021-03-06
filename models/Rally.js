const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const RallySchema = new Schema({

    name: {
        type: String,
        required: true
    },
    owners: {
        type: [String],
        required: true
    },
    ownerNames: {
        type: [String],
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    members: {
      type: [String]
    },
    memberNames: {
        type: [String],
        required: true
    },
    dateCreated: {
        date: String
    },
    dateExpires: {
        name: String
    },
    confirmed: {
        date: {
            type: Date
        },
        time: {
            type: Date
        },
        location: {
            type: String
        }
    },
    restrictions: {
        earliestTime: {
            type: Date
        },
        latestTime: {
            type: Date
        },
        location: {
          type: String
        },
        locationSuggRadius: {
            type: Number
        },
        timeOfWeek: {
            type: String
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        }
    },
    voting: {
       locations: {
           type: Map,
           of: Number
       }
   },

    timeSlot: {
        type: Map,
        of: Number
    }
});

module.exports = Rally = mongoose.model('rally', RallySchema);
