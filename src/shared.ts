import * as moment from 'moment-timezone';
import { webtoons } from '../typings/webtoons';

export function getWebtoonDate(offset = 0){
  return moment(new Date().toISOString())
    .tz('America/New_york')
    .subtract(offset, 'days');
}


const dateFormat = 'MMM D, YYYY'

function webtoonDate(date: webtoons.DateF){
  if(typeof date === 'string')
    return moment(date, dateFormat)
  else if(date instanceof Date)
    return moment(new Date().toISOString())
  else
    return date
}

export function webtoonDateWithOffset(date: webtoons.DateF, offset = 0){
  return webtoonDate(date)
    .subtract(offset, 'days')
}

export function webtoonDateFormatted(date: webtoons.DateF, offset = 0){
  return webtoonDateWithOffset(date, offset).format(dateFormat)
}

export function noOp() {}