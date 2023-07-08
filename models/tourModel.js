const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

//CREATING A SIMPLE TOUR SCHEMA
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name.'],
      unique: true,
      maxlength: [40, 'A tour must have a name of less than 40 characters.'],
      minlength: [10, 'A tour must have a name of more than 10 characters.'],
      // validate: [validator.isAlpha, 'Name must contain only characters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either: easy, medium or difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1.0'],
      max: [5, 'A rating must be below 5.0'],
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to the current doc on NEW doc creation
          return val > this.price;
        },
        message: 'Price Discount must be less than the regular price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: Boolean,
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// CREATING A INDEXES
// 1) SINGLE FIELD INDEX
tourSchema.index({ slug: 1 });
// 2) COMPOUND INDEX
tourSchema.index({ price: 1, ratingAverage: -1 });
// 3) GEOSPATIAL INDEX
tourSchema.index({ startLocation: '2dsphere' });

// DEFINING A VIRTUAL PROPERTY FOR THE SCHEMA
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE

// 1) PRE MIDDLEWARE/PRE-HOOK : RUNS BEFORE THE DOCUMENT IS SAVED IN THE DB i.e before .save() & .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// 3) QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', // Field to populate
    select: '-__v -passwordChangedAt', // Exclude the mentioned fields from the populated object
  });
  next();
});

// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds to complete`);
//   next();
// });

// 3) AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

//CREATING A MODEL OUT OF THE SCHEMA
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
