export type DateInput = {
  day: string;
  month: string;
  year: string;
};

export type TimeInput = {
  hour: string;
  minute: string;
};

export type DateTimeInput = DateInput & TimeInput;
