import { UnprocessableError } from '../../common/errors.js';
import Joi from '@hapi/joi';

const creationSchema = Joi.array()
  .items(
    Joi.object({
      c2sRate: Joi.number().required(),
      s2cRate: Joi.number().required(),
      MinRTT: Joi.number().required(),
      MaxRTT: Joi.number().required(),
      latitude: Joi.number(),
      longitude: Joi.number(),
      address: Joi.string(),
      ClientIP: Joi.string(),
      FullResults: Joi.string(),
      fields: Joi.array()
        .required()
        .min(1),
    }),
  )
  .min(1);

const updateSchema = Joi.array()
  .items(
    Joi.object({
      c2sRate: Joi.number().required(),
      s2cRate: Joi.number().required(),
      MinRTT: Joi.number().required(),
      MaxRTT: Joi.number().required(),
      latitude: Joi.number(),
      longitude: Joi.number(),
      address: Joi.string(),
      ClientIP: Joi.string(),
      FullResults: Joi.string().allow(''),
      fields: Joi.array()
        .required()
        .min(1),
    }),
  )
  .min(1);

export async function validateCreation(data) {
  try {
    data = Array.isArray(data) ? data : [data];
    const value = await creationSchema.validateAsync(data);
    return value;
  } catch (err) {
    throw new UnprocessableError('Unable to validate JSON: ', err);
  }
}

export async function validateUpdate(data) {
  try {
    data = Array.isArray(data) ? data : [data];
    const value = await updateSchema.validateAsync(data);
    return value;
  } catch (err) {
    throw new UnprocessableError('Unable to validate JSON: ', err);
  }
}
