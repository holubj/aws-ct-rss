import { Feed } from 'feed';
import axios from 'axios';
import { parse, HTMLElement } from 'node-html-parser';

export const handler = async (event, context, callback) => {
  const url = event.queryStringParameters['url'];

  const initFeed = (DOM: HTMLElement) => {
    const title = DOM.querySelector('title').rawText;
    return new Feed({
      title,
      description: title,
      id: url,
      link: url,
      language: 'cs',
      image: `https:${DOM.querySelector('#logo').attributes['src']}`,
      favicon: 'https://img.ceskatelevize.cz/loga/favicon_v3.ico',
      copyright: '© Česká televize',
    });
  };

  await axios
    .get(url)
    .then((response) => {
      const DOM = parse(response.data);
      const feed = initFeed(DOM);

      const list = DOM.querySelectorAll('.episodes-broadcast-content a');

      const currentDate = new Date();
      const recordDate = new Date();
      for (const record of list) {
        const recordUrl = `https://www.ceskatelevize.cz${record.attributes['href']}`;
        const title = record.lastChild.childNodes[0].rawText;
        recordDate.setHours(recordDate.getHours() - 1); // release date of record is unknown

        feed.addItem({
          title: title,
          id: recordUrl,
          link: recordUrl,
          description: title,
          date: currentDate,
          published: new Date(recordDate),
        });
      }

      callback(null, {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
        body: feed.atom1(),
      });
    })
    .catch((error) => {
      console.log(error);
    });
};
