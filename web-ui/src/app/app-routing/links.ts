/**
 * Contains all the information about the links
 */
interface Link{
  name: string;
  link: string;
  proxy: boolean;
}

const links: Link[] = [
  {
    name: 'xpath input',
    link: '/xpath-search',
    proxy: false,
  },
  {
    name: 'Home',
    link: '/home',
    proxy: false,
  },
  {
    name: 'Example-based search',
    link: '/example-based-search',
    proxy: true,
  },
  {
    name: 'XPath search',
    link: '/xpath-search',
    proxy: false,
  },
  {
    name: 'Documentation',
    link: '/documentation',
    proxy: false,
  },



];
var mainLinksName = [
  "Home",
  "Example-based search",
  "XPath search",
  "Documentation"
];

var mainLinks: Link[] = links.filter(route => mainLinksName.includes(route.name));


export{Link, links, mainLinks};
