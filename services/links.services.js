import { UrlShortener } from "../models/links.model.js";

export const loadLinks = async ({ limit = 10, skip = 0, createdBy }) => {
  let links;
  let totalLinks;
  if (createdBy) {
    links = await UrlShortener.find({ createdBy })
      .populate("createdBy")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    totalLinks = await UrlShortener.find({ createdBy }).countDocuments();
  } else {
    links = await UrlShortener.find()
      .populate("createdBy")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    totalLinks = await UrlShortener.find().countDocuments();
  }

  links.map(
    (link) => (link.createdBy = { ...link.createdBy, email: "", password: "" })
  );

  return { links, totalLinks };
};

export const addLink = async (link) => {
  return await UrlShortener.create(link);
};

export const getLink = async (shortCode) => {
  return await UrlShortener.findOne({ shortCode });
};

export const getLinkById = async (id) => {
  return await UrlShortener.findById(id);
};

export const updateLink = async (id, updatedShortUrl) => {
  return await UrlShortener.findByIdAndUpdate(id, updatedShortUrl);
};

export const deleteLink = async (id) => {
  return await UrlShortener.findByIdAndDelete(id);
};

export const deleteUserLinks = async (createdBy) => {
  return await UrlShortener.deleteMany({ createdBy });
};
