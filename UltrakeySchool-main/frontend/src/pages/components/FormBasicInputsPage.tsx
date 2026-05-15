import React, { useState } from 'react'

const FormBasicInputsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    textInput: '',
    emailInput: '',
    passwordInput: '',
    numberInput: '',
    telInput: '',
    urlInput: '',
    searchInput: '',
    textarea: '',
    select: '',
    multiSelect: [] as string[],
    radioOption: '',
    checkboxOptions: [] as string[],
    switchOption: false,
    fileInput: null,
    dateInput: '',
    timeInput: '',
    colorInput: '#6366f1',
    rangeInput: 50
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      if (name === 'checkboxOptions') {
        const checked = checkbox.checked
        const optionValue = checkbox.value
        setFormData(prev => ({
          ...prev,
          checkboxOptions: checked 
            ? [...prev.checkboxOptions, optionValue]
            : prev.checkboxOptions.filter(item => item !== optionValue)
        }))
      } else {
        setFormData(prev => ({ ...prev, [name]: checkbox.checked }))
      }
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null
      setFormData(prev => ({ ...prev, [name]: file }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Form submitted! Check console for data.')
  }

  return (
    <>
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
        <div className="my-auto mb-2">
          <h3 className="page-title mb-1">Basic Inputs</h3>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/">Dashboard</a>
              </li>
              <li className="breadcrumb-item">Forms</li>
              <li className="breadcrumb-item active" aria-current="page">Basic Inputs</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Form Demo */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Form Elements</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Text Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Text Input</label>
                  <input
                    type="text"
                    className="form-control"
                    name="textInput"
                    value={formData.textInput}
                    onChange={handleInputChange}
                    placeholder="Enter text here"
                  />
                  <div className="form-text">This is a standard text input field.</div>
                </div>
              </div>

              {/* Email Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Email Input</label>
                  <input
                    type="email"
                    className="form-control"
                    name="emailInput"
                    value={formData.emailInput}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                  />
                  <div className="form-text">Enter a valid email address.</div>
                </div>
              </div>

              {/* Password Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Password Input</label>
                  <input
                    type="password"
                    className="form-control"
                    name="passwordInput"
                    value={formData.passwordInput}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                  />
                  <div className="form-text">Password must be at least 8 characters.</div>
                </div>
              </div>

              {/* Number Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Number Input</label>
                  <input
                    type="number"
                    className="form-control"
                    name="numberInput"
                    value={formData.numberInput}
                    onChange={handleInputChange}
                    placeholder="Enter number"
                    min="0"
                    max="100"
                  />
                  <div className="form-text">Enter a number between 0 and 100.</div>
                </div>
              </div>

              {/* Phone Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Phone Input</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="telInput"
                    value={formData.telInput}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                  <div className="form-text">Enter your phone number.</div>
                </div>
              </div>

              {/* URL Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">URL Input</label>
                  <input
                    type="url"
                    className="form-control"
                    name="urlInput"
                    value={formData.urlInput}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                  <div className="form-text">Enter a valid URL.</div>
                </div>
              </div>

              {/* Search Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Search Input</label>
                  <div className="input-group">
                    <input
                      type="search"
                      className="form-control"
                      name="searchInput"
                      value={formData.searchInput}
                      onChange={handleInputChange}
                      placeholder="Search..."
                    />
                    <button className="btn btn-outline-secondary" type="button">
                      <i className="ti ti-search"></i>
                    </button>
                  </div>
                  <div className="form-text">Search functionality with button.</div>
                </div>
              </div>

              {/* Textarea */}
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">Textarea</label>
                  <textarea
                    className="form-control"
                    name="textarea"
                    value={formData.textarea}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Enter your message here..."
                  ></textarea>
                  <div className="form-text">Multi-line text input field.</div>
                </div>
              </div>

              {/* Select Dropdown */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Select Dropdown</label>
                  <select
                    className="form-select"
                    name="select"
                    value={formData.select}
                    onChange={handleInputChange}
                  >
                    <option value="">Choose an option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                    <option value="option4">Option 4</option>
                  </select>
                  <div className="form-text">Single selection dropdown.</div>
                </div>
              </div>

              {/* Multiple Select */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Multiple Select</label>
                  <select
                    className="form-select"
                    name="multiSelect"
                    value={formData.multiSelect}
                    onChange={handleInputChange}
                    multiple
                    size={4}
                  >
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                    <option value="option4">Option 4</option>
                    <option value="option5">Option 5</option>
                  </select>
                  <div className="form-text">Hold Ctrl/Cmd to select multiple options.</div>
                </div>
              </div>

              {/* Radio Buttons */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Radio Buttons</label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="radioOption"
                      value="option1"
                      checked={formData.radioOption === 'option1'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Option 1</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="radioOption"
                      value="option2"
                      checked={formData.radioOption === 'option2'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Option 2</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="radioOption"
                      value="option3"
                      checked={formData.radioOption === 'option3'}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Option 3</label>
                  </div>
                  <div className="form-text">Single selection radio buttons.</div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Checkboxes</label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="checkboxOptions"
                      value="option1"
                      checked={formData.checkboxOptions.includes('option1')}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Option 1</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="checkboxOptions"
                      value="option2"
                      checked={formData.checkboxOptions.includes('option2')}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Option 2</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="checkboxOptions"
                      value="option3"
                      checked={formData.checkboxOptions.includes('option3')}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Option 3</label>
                  </div>
                  <div className="form-text">Multiple selection checkboxes.</div>
                </div>
              </div>

              {/* Switch */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Toggle Switch</label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="switchOption"
                      checked={formData.switchOption}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">Enable notifications</label>
                  </div>
                  <div className="form-text">Toggle switch for boolean values.</div>
                </div>
              </div>

              {/* File Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">File Input</label>
                  <input
                    type="file"
                    className="form-control"
                    name="fileInput"
                    onChange={handleInputChange}
                  />
                  <div className="form-text">Upload a file from your device.</div>
                </div>
              </div>

              {/* Date Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Date Input</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dateInput"
                    value={formData.dateInput}
                    onChange={handleInputChange}
                  />
                  <div className="form-text">Select a date from the calendar.</div>
                </div>
              </div>

              {/* Time Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Time Input</label>
                  <input
                    type="time"
                    className="form-control"
                    name="timeInput"
                    value={formData.timeInput}
                    onChange={handleInputChange}
                  />
                  <div className="form-text">Select a specific time.</div>
                </div>
              </div>

              {/* Color Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Color Input</label>
                  <div className="d-flex align-items-center">
                    <input
                      type="color"
                      className="form-control form-control-color me-3"
                      name="colorInput"
                      value={formData.colorInput}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={formData.colorInput}
                      onChange={handleInputChange}
                      placeholder="#000000"
                    />
                  </div>
                  <div className="form-text">Choose a color from the picker.</div>
                </div>
              </div>

              {/* Range Input */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Range Input: {formData.rangeInput}</label>
                  <input
                    type="range"
                    className="form-range"
                    name="rangeInput"
                    value={formData.rangeInput}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                  <div className="form-text">Slide to select a value.</div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="reset" className="btn btn-outline-primary">
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Form
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Input States */}
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Input States</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Normal Input</label>
                <input type="text" className="form-control" placeholder="Normal state" />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Focus Input</label>
                <input type="text" className="form-control" placeholder="Focus state" autoFocus />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Disabled Input</label>
                <input type="text" className="form-control" placeholder="Disabled state" disabled />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Readonly Input</label>
                <input type="text" className="form-control" placeholder="Readonly state" readOnly />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Success Input</label>
                <input type="text" className="form-control is-valid" placeholder="Success state" />
                <div className="valid-feedback">Looks good!</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Error Input</label>
                <input type="text" className="form-control is-invalid" placeholder="Error state" />
                <div className="invalid-feedback">Please provide a valid input.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FormBasicInputsPage
