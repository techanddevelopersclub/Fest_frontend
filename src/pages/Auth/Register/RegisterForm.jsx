import { useState } from "react";
import styles from "./../common.module.css";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../../state/redux/auth/authSlice";
import Logo from "../../../components/Logo/Logo";
import { Link } from "react-router-dom";
import { useRegisterMutation } from "../../../state/redux/auth/authApi";
import FormProgress from "../../../components/FormProgress/FormProgress";
import imageCompression from "browser-image-compression";

// Common colleges list
const COMMON_COLLEGES = [
  "Indian Institute of Technology (IIT)",
  "National Institute of Technology (NIT)",
  "Birla Institute of Technology and Science (BITS)",
  "Delhi Technological University (DTU)",
  "Netaji Subhas University of Technology (NSUT)",
  "Jamia Millia Islamia",
  "University of Delhi",
  "Jawaharlal Nehru University (JNU)",
  "Amity University",
  "Manipal Institute of Technology",
  "Vellore Institute of Technology (VIT)",
  "SRM Institute of Science and Technology",
  "Anna University",
  "Indian Institute of Science (IISc)",
  "Indian Statistical Institute (ISI)",
  "Indian Institute of Management (IIM)",
  "Symbiosis International University",
  "Christ University",
  "Lovely Professional University",
  "Chandigarh University",
  "KIIT University",
  "Bennett University",
  "Ashoka University",
  "Shiv Nadar University",
  "THDC-IHET",
  "Other"
];

// Common branch names
const COMMON_BRANCHES = [
  "Computer Science and Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics and Communication Engineering (ECE)",
  "Electrical Engineering (EE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Chemical Engineering (CHE)",
  "Aerospace Engineering",
  "Biotechnology",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Software Engineering",
  "Computer Engineering",
  "Electronics Engineering",
  "Instrumentation Engineering",
  "Production Engineering",
  "Industrial Engineering",
  "Environmental Engineering",
  "Petroleum Engineering",
  "Mining Engineering",
  "Metallurgical Engineering",
  "Textile Engineering",
  "Agricultural Engineering",
  "Food Technology",
  "Pharmaceutical Engineering",
  "Other"
];

const RegisterForm = () => {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [imageUploading, setImageUploading] = useState(false);

  // Cloudinary values from .env
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // paginated register form
  const [page, setPage] = useState(0);

  const pages = [
    {
      label: "Account",
      fields: [
        { label: "Name", name: "name", type: "text", placeholder: "name", required: true, autoComplete: "name" },
        { label: "Email", name: "email", type: "email", placeholder: "email", required: true, autoComplete: "email" },
        { label: "Mobile Number", name: "mobile", type: "tel", placeholder: "mobile number", required: true, autoComplete: "tel" },
        { label: "Password", name: "password", type: "password", placeholder: "password", required: true, autoComplete: "new-password" },
        { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "confirm password", required: true, autoComplete: "new-password" },
      ],
      validate: () => {
        const requiredFields = pages[page].fields.filter((field) => field.required);
        for (const field of requiredFields) {
          if (!formValues[field.name]) {
            setError(`${field.label} is required`);
            return false;
          }
        }
        if (formValues.password !== formValues.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        if (!/^\d{10}$/.test(formValues.mobile)) {
          setError("Enter a valid 10-digit mobile number");
          return false;
        }
        return true;
      },
    },
    {
      label: "College",
      fields: [
        { label: "College", name: "college", type: "collegeSelect", options: COMMON_COLLEGES, placeholder: "Type or select your college", required: true },
        { label: "Branch Name", name: "branchName", type: "select", options: COMMON_BRANCHES, placeholder: "Select your branch", required: true },
        { label: "Degree", name: "degree", placeholder: "degree", required: true },
        { label: "Graduation Year", name: "yearOfGraduation", placeholder: "graduation year", required: true },
      ],
      validate: () => {
        const requiredFields = pages[page].fields.filter((field) => field.required);
        for (const field of requiredFields) {
          if (!formValues[field.name]) {
            setError(`${field.label} is required`);
            return false;
          }
        }
        return true;
      },
    },
    {
      label: "Personal",
      fields: [
        { label: "Gender", name: "gender", type: "radio", options: ["male", "female", "other"], required: true },
        {
          label: "Upload your recent image",
          name: "image",
          type: "file",
          required: true,
          description: "It will be used for verification in future",
        },
      ],
      validate: () => {
        const requiredFields = pages[page].fields.filter((field) => field.required);
        for (const field of requiredFields) {
          if (!formValues[field.name]) {
            setError(`${field.label} is required`);
            return false;
          }
        }
        return true;
      },
    },
  ];

  const hasNext = () => page < pages.length - 1;
  const hasPrevious = () => page > 0;

  const handleNext = (e) => {
    e.preventDefault();
    if (hasNext() && pages[page].validate()) {
      setPage(page + 1);
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    if (hasPrevious()) {
      setPage(page - 1);
    }
  };



  
const handleChange = async (e) => {
  const { name, value, type, files } = e.target;
  if (type === "file" && files && files[0]) {
    setImageUploading(true);
    setError(null);

    try {
      // 👇 compression options
      const options = {
        maxSizeMB: 0.5,            // target max file size ~500KB
        maxWidthOrHeight: 800,     // resize if larger than 800px
        useWebWorker: true,        // better performance
      };

      // 👇 compress image before upload
      const compressedFile = await imageCompression(files[0], options);

      // 👇 prepare formData with compressed image
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      // 👇 upload to Cloudinary
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) {
        setFormValues((prev) => ({ ...prev, image: data.secure_url }));
        console.log("Uploaded image:", data.secure_url);
      } else {
        setError("Image upload failed");
      }
    } catch (err) {
      console.error(err);
      setError("Image upload error");
    }

    setImageUploading(false);
  } else {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await register(formValues).unwrap();
      dispatch(setCredentials(data));
    } catch (error) {
      setError(error.data?.message || "Registration failed");
    }
  };

  return (
    <div className={styles.form}>
      <Logo className={styles.logo} />
      <div className={styles.progress}>
        <FormProgress pages={pages} currentPageIndex={page} />
      </div>
      <form onSubmit={handleSubmit}>
        {pages[page].fields.map((field) => {
          let inputElement;
          switch (field.type) {
            case "radio":
              inputElement = (
                <div className={styles.radioGroup}>
                  {field.options.map((option) => (
                    <div key={option} className={styles.radio}>
                      <input
                        type="radio"
                        name={field.name}
                        id={option}
                        value={option}
                        onChange={handleChange}
                        required={field.required}
                        defaultChecked={formValues[field.name] === option}
                      />
                      <label htmlFor={option}>{option}</label>
                    </div>
                  ))}
                </div>
              );
              break;
            case "file":
              inputElement = (
                <>
                  <input
                    className={styles.input}
                    type="file"
                    name={field.name}
                    id={field.name}
                    accept="image/*"
                    required={field.required}
                    onChange={handleChange}
                  />
                  {imageUploading && <span style={{ color: "Blue" }}>Uploading...</span>}

                  {formValues.image && (
                    <img src={formValues.image} alt="Uploaded" style={{ maxWidth: 100, marginTop: 8 }} />
                  )}
                  {field.description && <small>{field.description}</small>}
                </>
              );
              break;
            case "select":
              inputElement = (
                <select
                  className={styles.input}
                  name={field.name}
                  id={field.name}
                  required={field.required}
                  onChange={handleChange}
                  defaultValue={formValues[field.name] || ""}
                >
                  <option value="" disabled>
                    {field.placeholder}
                  </option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              );
              break;
            case "collegeSelect":
              inputElement = (
                <div className={styles.collegeSelectContainer}>
                  <input
                    className={styles.input}
                    type="text"
                    name={field.name}
                    id={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={handleChange}
                    defaultValue={formValues[field.name] || ""}
                    list={`${field.name}-options`}
                    autoComplete="off"
                  />
                  <datalist id={`${field.name}-options`}>
                    {field.options.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <small className={styles.inputHint}>
                    Type to search or select from the dropdown
                  </small>
                </div>
              );
              break;
            default:
              inputElement = (
                <input
                  className={styles.input}
                  type={field.type || "text"}
                  name={field.name}
                  id={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={handleChange}
                  defaultValue={formValues[field.name] || ""}
                  autoComplete={field.autoComplete}
                />
              );
              break;
          }
          return (
            <div key={field.name} className={styles.formGroup}>
              <label htmlFor={field.name} className={styles.label}>
                {field.label}
              </label>
              {inputElement}
            </div>
          );
        })}
        {error && <span className={styles.error}>{error}</span>}
        <div className={styles.actions}>
          {hasPrevious() && (
            <button
              className={styles.secondary}
              disabled={isLoading}
              type="button"
              onClick={handlePrevious}
            >
              Previous
            </button>
          )}
          <button
            className={styles.primary}
            disabled={isLoading}
            type={page === pages.length - 1 ? "submit" : "button"}
            onClick={page === pages.length - 1 ? null : handleNext}
          >
            {page === pages.length - 1 ? "Register" : "Next"}
          </button>
        </div>
        <div className={styles.info}>
          <span>Already have an account?</span>
          <Link to="/a/login">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
