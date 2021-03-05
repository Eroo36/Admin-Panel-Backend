import randomstring from 'randomstring';

export default () => randomstring.generate({length: 4, charset: 'numeric'});
