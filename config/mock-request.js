export default () => {
  const req = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  req.header = jest.fn().mockReturnValue(req);
  return req;
};
