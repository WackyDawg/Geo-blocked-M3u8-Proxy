module.exports = (req, res, next) => {
  const requiredParams = [
    "appName",
    "appVersion",
    "clientTime",
    "deviceDNT",
    "deviceId",
    "deviceMake",
    "deviceModel",
    "deviceType",
    "deviceVersion",
    "includeExtendedEvents",
    "serverSideAds",
    "sid",
  ];

  const queryKeys = Object.keys(req.query);
  const missingParams = requiredParams.filter(
    (param) => !queryKeys.includes(param)
  );

  if (missingParams.length > 0) {
    return res
      .status(400)
      .json({ error: "Missing required parameters", missingParams });
  }

  next();
};
