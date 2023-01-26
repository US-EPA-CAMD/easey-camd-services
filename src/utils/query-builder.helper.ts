import { Regex } from '@us-epa-camd/easey-common/utilities';

export class QueryBuilderHelper {
  public static dateHrQtr(dateHrQtrValue: string, beginDate: Boolean) {
    if (String(dateHrQtrValue).match(/^\d{4}\sQ[1-4]$/) != null) {
      const dateValue = dateHrQtrValue.split(' Q');
      const month = beginDate
        ? parseInt(dateValue[1]) * 3 - 3
        : parseInt(dateValue[1]) * 3;
      const year = parseInt(dateValue[0]);
      const day = beginDate ? 1 : 0;
      const date = new Date(year, month, day);
      return date;
    } else {
      const dateValue = dateHrQtrValue.split(' ');
      const date = new Date(`${dateValue[0]}`);
      if (dateValue[1]) {
        date.setHours(date.getHours() + parseInt(`${dateValue[1]}`));
      }
      return date;
    }
  }

  public static beginDateHrQtr(query: any, dateHrQtrValue: string) {
    const beginDate = this.dateHrQtr(dateHrQtrValue, true);
    query.andWhere('es.matchTimeBeginValue >= :beginDate', {
      beginDate: beginDate,
    });
    return query;
  }

  public static endDateHrQtr(query: any, dateHrQtrValue: string) {
    const endDate = this.dateHrQtr(dateHrQtrValue, false);
    query.andWhere('es.matchTimeEndValue <= :endDate', { endDate: endDate });
    return query;
  }

  public static whereLocations(query: any, locations: string[], alias: string) {
    if (locations) {
      let string = '(';

      for (let i = 0; i < locations.length; i++) {
        const regex = Regex.commaDelimited(locations[i].toUpperCase());

        if (i === 0) {
          string += `(UPPER(${alias}.locationNameList) ~* ${regex}) `;
        } else {
          string += `OR (UPPER(${alias}.locationNameList) ~* ${regex}) `;
        }
      }

      string += ')';
      query.andWhere(string);
    }

    return query;
  }
}
