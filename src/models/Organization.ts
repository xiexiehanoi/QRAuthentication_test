import { Model, model, models, Schema, Document, Types } from "mongoose";

export interface IOrganization extends Document {
  _id: Types.ObjectId;
  name: string;
  subdomain: string;
  customDomain?: string;
  customDomainVerified?: boolean;
  clerkOrgId: string; // Clerk organization ID
  clerkOwnerId: string; // Clerk user ID
  settings: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
    };
    features: {
      enableBlog: boolean;
      enableForum: boolean;
      enableLiveClasses: boolean;
    };
  };
  banners: IBanner[];
  plan: "free" | "basic" | "premium";
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

export interface IBanner {
  uri: string;
  type: string;
  createdAt: Date;
  redirect?: string;
}

// const bannerSchema = new Schema<IBanner>(
//   {
//     uri: { type: String },
//     type: { type: String },
//     createdAt: { type: Date },
//     redirect: { type: String }
//   },
//   { _id: false }
// );

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    // subdomain: { type: String, required: true, unique: true, lowercase: true },
    // customDomain: { type: String, unique: true, sparse: true, lowercase: true },
    // customDomainVerified: { type: Boolean, default: false },
    // clerkOrgId: { type: String, required: true, unique: true },
    // clerkOwnerId: { type: String, required: true },
    // settings: {
    //   theme: {
    //     primaryColor: { type: String, default: "#007bff" },
    //     secondaryColor: { type: String, default: "#6c757d" },
    //     logo: { type: String },
    //   },
    //   features: {
    //     enableBlog: { type: Boolean, default: true },
    //     enableForum: { type: Boolean, default: true },
    //     enableLiveClasses: { type: Boolean, default: false },
    //   },
    // },
    // banners: {
    //   type: [bannerSchema],
    //   default: [],
    // },
    // plan: { type: String, enum: ["free", "basic", "premium"], default: "free" },
    // status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
  },
  // {
  //   timestamps: true,
  //   toJSON: { virtuals: true }, // Ensure virtuals are included
  //   toObject: { virtuals: true },
  // }
);

// NOTE: Indexes for faster queries later.
// OrganizationSchema.index({ subdomain: 1 });
// OrganizationSchema.index({ customDomain: 1 });
// OrganizationSchema.index({ clerkOrgId: 1 });
// OrganizationSchema.index({ ownerId: 1 });

export const OrganizationModel =
  (models?.Organization as Model<IOrganization, {}, {}, {}, any>) || model<IOrganization>("Organization", OrganizationSchema);