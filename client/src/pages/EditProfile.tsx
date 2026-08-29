function EditProfile() {
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
              U
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

          {/* Display Name */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Display Name
            </label>

            <input
              type="text"
              placeholder="Enter your display name"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Location */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Location
            </label>

            <input
              type="text"
              placeholder="Enter your location"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* GitHub Username */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              GitHub Username
            </label>

            <input
              type="text"
              placeholder="Enter your GitHub username"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* LinkedIn Username */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              LinkedIn Username
            </label>

            <input
              type="text"
              placeholder="Enter your LinkedIn username"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* LeetCode Username */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              LeetCode Username
            </label>

            <input
              type="text"
              placeholder="Enter your LeetCode username"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* X Username */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              X Username
            </label>

            <input
              type="text"
              placeholder="Enter your X username"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {/* ReadMe */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              ReadMe
            </label>

            <textarea
              rows={5}
              placeholder="Write something about yourself..."
              className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
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

          {/* Work */}
          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Work
            </label>

            <input
              type="text"
              placeholder="Enter your work or experience"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>
        </section>

      </div>
    </div>
  );
}

export default EditProfile;