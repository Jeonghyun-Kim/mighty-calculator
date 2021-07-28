import moment from 'moment';
import 'moment/locale/ko';

moment.locale('ko');

export function momentDate(date: Date | string) {
  return moment(date);
}
