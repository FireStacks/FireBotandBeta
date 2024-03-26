import { FireMessage } from "@fire/lib/extensions/message";
import { classicRemind, constants } from "@fire/lib/util/constants";
import { ParsedResult, casual } from "chrono-node";
import { ArgumentTypeCaster } from "discord-akairo";
import * as dayjs from "dayjs";

const {
  regexes: { time },
} = constants;

export type ParsedTime = { text: string; date: Date };

export const timeTypeCaster: ArgumentTypeCaster = (
  message: FireMessage,
  phrase
) => {
  const content = phrase.trim();
  return parseTime(
    content,
    message.createdAt,
    message.author.settings.get<string>("reminders.timezone.iana", "Etc/UTC")
  );
};

const doubledUpWhitespace = /\s{2,}/g;

export const parseTime = (text: string, instant: Date, IANA: string) => {
  text = text.trim();
  let useClassic = false;
  for (const regex of Object.values(time)) {
    if (Array.isArray(regex)) continue;
    if (regex.test(text)) useClassic = true;
    regex.lastIndex = 0;
  }
  let parsed: ParsedResult[];
  if (useClassic)
    parsed = classicRemind.parse(text, { instant }, { forwardDate: true });
  else {
    // Get the date first, doesn't need to be exact with timing since we only want it to get the offset
    // This will probably break if you try to set a reminder around the switch to/from DST
    // but if you're doing that, fuck you.
    // timezones suck, daylight savings sucks more
    const preliminaryParse = casual.parse(
      text,
      { instant },
      { forwardDate: true }
    );
    const date = preliminaryParse[0]?.start.date();
    if (!date) return null;
    let offset: number;
    if (preliminaryParse[0].start.get("timezoneOffset") == null) {
      // Instead of the old offset we got from browsers, we'll use an IANA timezone name
      // and that + the date from above allows us to get the correct offset for DST
      date.setHours(23, 59, 59, 999); // should be past the dst switch in most timezones
      offset = dayjs.tz(date, IANA).utcOffset();
    }
    // This means a timezone was specified in the text so we'll use that
    else offset = preliminaryParse[0].start.get("timezoneOffset");

    parsed = casual.parse(
      text,
      { instant, timezone: offset },
      { forwardDate: true }
    );
  }
  if (!parsed.length) return null;
  const foundTimes = parsed[0].text.split(",");
  for (const time of foundTimes) text = text.replace(time, "");
  text = text.replace(doubledUpWhitespace, " ").trim();
  return { text: text, date: parsed[0].start.date() };
};
