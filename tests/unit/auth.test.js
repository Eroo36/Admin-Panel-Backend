import {mockRequest, mockResponse} from '../../config';
import {auth} from '../../middlewares';

describe('Index Test', () => {
  test('should be equal', async () => {
    const req = mockRequest();
    const res = mockResponse();
    await auth(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

});
 /*  test('should be equal', async () => {
    const req = mockRequest();
    const res = mockResponse();
    req.header = {Authorization: 'fake-token'};
    await auth(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  }); */