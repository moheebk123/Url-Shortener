import { UrlShortener } from "../models/links.model.js";

export const loadLinks = async ({limit = 10, skip = 0}) => {
  const links = await UrlShortener.find()
    .populate("createdBy")
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

    const totalLinks = await UrlShortener.find().countDocuments();

  links.map(
    (link) => (link.createdBy = { ...link.createdBy, email: "", password: "" })
  );
  return { links, totalLinks };
};

export const loadHomeLinks = async () => {
  const links = await UrlShortener.find()
    .populate("createdBy")
    .limit(5)
    .sort({ createdAt: -1 });
  links.map(
    (link) => (link.createdBy = { ...link.createdBy, email: "", password: "" })
  );
  return links;
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
}
