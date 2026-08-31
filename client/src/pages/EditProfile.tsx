import { useEffect, useState } from "react";
import { getProfile } from "../services/profileService";
import { colleges } from "../data/colleges";

  function EditProfile() {
 const [displayName, setDisplayName] = useState("");
const [location, setLocation] = useState("");
const [githubUsername, setGithubUsername] = useState("");
const [linkedinUsername, setLinkedinUsername] = useState("");
const [leetcodeUsername, setLeetcodeUsername] = useState("");
const [xUsername, setXUsername] = useState("");
const [readMe, setReadMe] = useState("");
const [workExperience, setWorkExperience] = useState("");
const [education, setEducation] = useState("");
const [skills, setSkills] = useState("");
const [currentLearning, setCurrentLearning] = useState("");
const [interests, setInterests] = useState("");
const [learningGoals, setLearningGoals] = useState("");
const [college, setCollege] = useState("");

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const data = await getProfile();

      setDisplayName(data.user.name);
      setCollege(data.user.college || "");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  fetchProfile();
}, []);


const handleSave = async () => {
  const profileData = {
    name: displayName,
    college,
    location,
    githubUsername,
    linkedinUsername,
    leetcodeUsername,
    xUsername,
    readMe,
    workExperience,
    education,
    skills,
    currentLearning,
    interests,
    learningGoals,
  };

  try {
  const response = await fetch("http://localhost:5000/api/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  console.log(data);
} catch (error) {
  console.error("Failed to save profile:", error);
}
};

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Profile Photo */}
        <section className="mb-10">
          <h2 className="text-xl font-bold">
            Profile Photo
          </h2>

          <div className="mt-4 flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-700 text-3xl font-bold">
              👤
            </div>

            <button
              type="button"
              className="rounded-lg bg-gray-700 px-5 py-2 font-semibold transition hover:bg-gray-600"
            >
              Change Photo
            </button>
          </div>
        </section>

        {/* General */}
        <section>
          <h2 className="text-xl font-bold">
            General
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Manage your basic profile information.
          </p>

          <div className="mt-5 space-y-5">

            {/* Display Name */}
            <div>
              <label className="mb-2 block font-semibold">
                 Name
              </label>

              <input
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* College name */}
            <div className="mt-4">
              <label className="block text-white mb-2">
                College
              </label>
              <select 
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                 <option value="">Add your college</option>
                 {colleges.map((collegeName) => (
                   <option key={collegeName} value={collegeName}>
                     {collegeName}
                   </option>
                 ))}
              </select>
            </div>


            {/* Location */}
            <div>
              <label className="mb-2 block font-semibold">
                Location
              </label>

              <input
                type="text"
                placeholder="Enter your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="mb-2 block font-semibold">
                GitHub Username
              </label>

              <input
                type="text"
                placeholder="Enter your GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="mb-2 block font-semibold">
                LinkedIn Username
              </label>

              <input
                type="text"
                placeholder="Enter your LinkedIn username"
                value={linkedinUsername}
                onChange={(e) => setLinkedinUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* LeetCode */}
            <div>
              <label className="mb-2 block font-semibold">
                LeetCode Username
              </label>

              <input
                type="text"
                placeholder="Enter your LeetCode username"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* X */}
            <div>
              <label className="mb-2 block font-semibold">
                X Username
              </label>

              <input
                type="text"
                placeholder="Enter your X username"
                value={xUsername}
                onChange={(e) => setXUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* ReadMe */}
            <div>
              <label className="mb-2 block font-semibold">
                ReadMe
              </label>

              <textarea
                rows={5}
                placeholder="Write something about yourself..."
                value={readMe}
                onChange={(e) => setReadMe(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

          </div>
        </section>

        {/* Experience */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">
            Experience
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Share your growth from learning to career.
          </p>

          <div className="mt-5 space-y-5">

            {/* Work */}
            <div>
              <label className="mb-2 block font-semibold">
                Work
              </label>

             <textarea
  rows={6}
  placeholder="Write about your work experience..."
  value={workExperience}
  onChange={(e) => setWorkExperience(e.target.value)}
  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
/>
            </div>

            {/* Education */}
            <div>
              <label className="mb-2 block font-semibold">
                Education
              </label>

              <input
                type="text"
                placeholder="Enter your education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="mb-2 block font-semibold">
                Skills
              </label>

              <input
                type="text"
                placeholder="Enter your skills separated by commas"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

          </div>
        </section>

        {/* Learning */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">
            Learning
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Tell others what you are currently learning.
          </p>

          <div className="mt-5 space-y-5">

            {/* Current Learning */}
            <div>
              <label className="mb-2 block font-semibold">
                Current Learning
              </label>

              <input
                type="text"
                placeholder="What are you currently learning?"
                  value={currentLearning}
                onChange={(e) => setCurrentLearning(e.target.value)} 
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="mb-2 block font-semibold">
                Interests
              </label>

              <input
                type="text"
                placeholder="Enter your interests"
                  value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Learning Goals */}
            <div>
              <label className="mb-2 block font-semibold">
                Learning Goals
              </label>

              <textarea
                rows={4}
                placeholder="Enter your learning goals"
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

          </div>
        </section>

        {/* Curate Your Profile */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">
            Curate your profile
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Control what opens to the public.
          </p>

          <div className="mt-5 space-y-4">

            {/* Coding Activity */}
            <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-5 py-4">
              <div>
                <p className="font-semibold">
                  Coding Activity
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Show your coding activity on profile
                </p>
              </div>

              <input
                type="checkbox"
                className="h-5 w-5"
              />
            </div>

            {/* Achievements */}
            <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-5 py-4">
              <div>
                <p className="font-semibold">
                  Achievements
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Show your achievements on profile
                </p>
              </div>

              <input
                type="checkbox"
                className="h-5 w-5"
              />
            </div>

            {/* Learning Progress */}
            <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-5 py-4">
              <div>
                <p className="font-semibold">
                  Learning Progress
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Show your learning progress on profile
                </p>
              </div>

              <input
                type="checkbox"
                className="h-5 w-5"
              />
            </div>

          </div>
        </section>

        {/* Save Button */}
        <div className="mt-10 pb-10">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}

export default EditProfile;