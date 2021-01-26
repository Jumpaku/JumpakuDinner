import { describe, expect, test, it } from "@jest/globals";
import { Jwt, IssueOptions, VerifyOptions } from "./jwt";

const issueOption: IssueOptions = {
  algorithm: "HS512",
  subject: "test-subject",
  issuer: "test-issuer",
  audience: "test-audience",
  expiresIn: 60 * 60,
  notBefore: -60,
};
const verifyOption: VerifyOptions = {
  algorithms: ["HS512"],
  issuer: "test-issuer",
  audience: "test-audience",
  subject: "test-subject",
};
const secret = "test-secret";

describe("jwt", () => {
  const jwt = new Jwt(secret, issueOption, verifyOption);
  const data = { accountId: 1234 };
  describe("verify()", () => {
    //https://jwt.io/#debugger-io?token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6InRlc3QtYXVkaWVuY2UiLCJpYXQiOjE1MTYyNDAwMDAsImV4cCI6MTUxNjI0MzYwMCwibmJmIjoxNTE2MjM5OTkwLCJkYXRhIjp7ImFjY291bnRJZCI6MTIzNH19.MASEeY-i8Q7Cu8cyzuhGAnbU-ov7N_ppVe-vcuMeNRp9ZL-kX1c7wsWkSmL-D-eBo4DOEv__FT49CUihr37F4w
    const token =
      "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6InRlc3QtYXVkaWVuY2UiLCJpYXQiOjE1MTYyNDAwMDAsImV4cCI6MTUxNjI0MzYwMCwibmJmIjoxNTE2MjM5OTkwLCJkYXRhIjp7ImFjY291bnRJZCI6MTIzNH19.MASEeY-i8Q7Cu8cyzuhGAnbU-ov7N_ppVe-vcuMeNRp9ZL-kX1c7wsWkSmL-D-eBo4DOEv__FT49CUihr37F4w";
    it("verifies token", () => {
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516240100 }, verifyOption)
      );
      expect(value).toEqual(data);
    });
    it("fails verification if token is expired", () => {
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516243601 }, verifyOption)
      );
      expect(error?.name).toEqual("JwtError");
    });
    it("fails verification if token is not activated yet", () => {
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516239989 }, verifyOption)
      );
      expect(error?.name).toEqual("JwtError");
    });
    it("fails verification if token subject is wrong", () => {
      // https://jwt.io/#debugger-io?token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3cm9uZy1zdWJqZWN0IiwiaXNzIjoidGVzdC1pc3N1ZXIiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6eyJhY2NvdW50SWQiOjEyMzR9fQ.Gb0TaP2rmL5XyhSGRLBBSKz0HiTDVbjJ9nRGzNEsa3POfUaiYm65OxmRJllzR83CnroCdYm78p5-mGXzOqWy2w
      const token =
        "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3cm9uZy1zdWJqZWN0IiwiaXNzIjoidGVzdC1pc3N1ZXIiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6eyJhY2NvdW50SWQiOjEyMzR9fQ.Gb0TaP2rmL5XyhSGRLBBSKz0HiTDVbjJ9nRGzNEsa3POfUaiYm65OxmRJllzR83CnroCdYm78p5-mGXzOqWy2w";
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516240100 }, verifyOption)
      );
      expect(error?.name).toEqual("JwtError");
    });
    it("fails verification if token issuer is wrong", () => {
      // https://jwt.io/#debugger-io?token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ3cm9uZy1pc3N1ZXIiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6eyJhY2NvdW50SWQiOjEyMzR9fQ.XKvgO-kLfODwpG9uJ0YQyyY70wrIUDhDQdUrAbGAVPAPgVx88iKUxztaB1WOxExhQHAQ28GrV_Gzo0HoNUBFfw
      const token =
        "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ3cm9uZy1pc3N1ZXIiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6eyJhY2NvdW50SWQiOjEyMzR9fQ.XKvgO-kLfODwpG9uJ0YQyyY70wrIUDhDQdUrAbGAVPAPgVx88iKUxztaB1WOxExhQHAQ28GrV_Gzo0HoNUBFfw";
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516240100 }, verifyOption)
      );
      expect(error?.name).toEqual("JwtError");
    });
    it("fails verification if token audience is wrong", () => {
      // https://jwt.io/#debugger-io?token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6Indyb25nLWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6eyJhY2NvdW50SWQiOjEyMzR9fQ.TiIr71QWiGPxIxt-QFsrclMKrELCRQeiI6Llx6QBq3nKZ1HFnKM-rvUOkq1KkEfAwuAMUCqX2UImXwtBx_Z8Vg
      const token =
        "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6Indyb25nLWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6eyJhY2NvdW50SWQiOjEyMzR9fQ.TiIr71QWiGPxIxt-QFsrclMKrELCRQeiI6Llx6QBq3nKZ1HFnKM-rvUOkq1KkEfAwuAMUCqX2UImXwtBx_Z8Vg";
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516240100 }, verifyOption)
      );
      expect(error?.name).toEqual("JwtError");
    });
    it("fails verification if token data is malformed", () => {
      // https://jwt.io/#debugger-io?token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6Indyb25nLWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6e319.SKveau18_Lz6iGuf6VRODC-58DUho7kZpJoCmvQOdHiKZYqufPssCT6xTaYvOBDbBOnesb8yJSrinavMo0t-Dw
      const token =
        "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1YmplY3QiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6Indyb25nLWF1ZGllbmNlIiwiaWF0IjoxNTE2MjQwMDAwLCJleHAiOjE1MTYyNDM2MDAsIm5iZiI6MTUxNjIzOTk5MCwiZGF0YSI6e319.SKveau18_Lz6iGuf6VRODC-58DUho7kZpJoCmvQOdHiKZYqufPssCT6xTaYvOBDbBOnesb8yJSrinavMo0t-Dw";
      const { value, error } = jwt.verify(
        token,
        Object.assign({ clockTimestamp: 1516240100 }, verifyOption)
      );
      expect(error?.name).toEqual("JwtError");
    });
  });
  test("issue()", () => {
    const token = jwt.issue(data, issueOption);
    const { value, error } = jwt.verify(token, verifyOption);
    expect(value).toEqual(data);
  });
});
