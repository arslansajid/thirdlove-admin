import React from 'react';
import Firebase from 'firebase';
import config from './config';
import './App.css';
import Swal from 'sweetalert2';
import Loader from 'react-loader-spinner';
import Img from 'react-image';
import Select from 'react-select';
import { COLOR_OPTIONS } from './ColorOptions'; 

class App extends React.Component {

  constructor(props){
    super(props);
    Firebase.initializeApp(config);

    this.state = {
      items: [],
      images:[],
      updatedImages: [],
      name: '',
      role: '',
      image: null,
      loading: true,
      saveLoading: false,
      colors: [],
    }
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.getItemsData();
  }
  
  componentDidUpdate(prevProps, prevState) {
    // check on previous state
    // only write when it's different with the new state
    if (prevState !== this.state) {
      this.writeUserData();
    }
  }

  writeUserData = () => {
    Firebase.database().ref('/items').set(this.state.items);
    console.log('DATA SAVED');
  }
  
  getItemsData = () => {
    let ref = Firebase.database().ref('/');
    ref.on('value', snapshot => {
      const data = snapshot.val();
      this.setState({
        items: data ? data.items : [],
        loading: false
      });
    });
  }

  returnImageUrlonUpload = (image) => {
    const storageService = Firebase.storage();
    const storageRef = storageService.ref();
    return new Promise(function(resolve, reject) {
    const uploadTask = storageRef.child(`images/${image.name}`).put(image); //create a child directory called images, and place the file inside this directory
    uploadTask.on('state_changed', (snapshot) => {
      // Observe state change events such as progress, pause, and resume
      }, (error) => {
        // Handle unsuccessful uploads
        reject(error);
      }, () => {
         // Do something once upload is complete
         console.log('File uploaded successfully');
         uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
          console.log('File available at', downloadURL);
          resolve(downloadURL);
        });
      });
    })
  }

  async handleSubmit (event) {
    event.preventDefault();
    this.setState({ saveLoading: true })
    const { images, updatedImages } = this.state;
    let imageUrl = [];
    let updatedImageUrl = [];
    try {
      if(images.length && updatedImages.length) {
        for(let i=0; i<= updatedImages.length; i++) {
          updatedImageUrl.push(await this.returnImageUrlonUpload(updatedImages[i]));
        }
      } else {
        for(let i=0; i<= images.length; i++) {
          imageUrl.push(await this.returnImageUrlonUpload(images[i]));
        }
      }
    } catch(error) {
      console.log('ERROR:', error);
    }

    let name = this.state.name;
    let role = this.state.role;
    let uid = this.refs.uid.value;
    
    if (uid && name && role){
      const { items } = this.state;
      const devIndex = items.findIndex(data => {
        return data.uid === uid 
      });
      items[devIndex].name = name;
      items[devIndex].role = role;
      items[devIndex].imageUrl = [...this.state.images, ...updatedImageUrl];
      this.setState({ items, saveLoading: false });
      Swal.fire(
        'Item Updated!',
        'Item updated successfully!',
        'success'
      )
    }
    else if (name && role ) {
      const uid = new Date().getTime().toString();
      const { items } = this.state;
      items.push({ uid, name, role, imageUrl })
      this.setState({ items, saveLoading: false });
      Swal.fire(
        'Item Added!',
        'Item added successfully!',
        'success'
      )
    }

    this.refs.uid.value = '';
    this.setState({
      name: '',
      role: '',
      images: [],
      colors: [],
      updatedImages: []
    })
  }
  
  removeData = (item) => {
    const { items } = this.state;
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        const newState = items.filter(data => {
          return data.uid !== item.uid;
        });
        this.setState({ items: newState });
        Swal.fire(
          'Deleted!',
          'Your file has been deleted.',
          'success'
        )
      }
    })
  }
  
  updateData = (item) => {
    this.refs.uid.value = item.uid;
    // this.refs.name.value = item.name;
    // this.refs.role.value = item.role;\
    this.setState({
      name: item.name,
      role: item.role,
      colors: item.colors ? item.colors : [],
      images: item.imageUrl ? item.imageUrl : []
    })
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    })
  }

  handleImageFile = (event) => {
    const { images } = this.state;
    if(images.length) {
      this.setState({
        updatedImages: event.target.files
      })
    } else {
    this.setState({
      images: event.target.files
    })
  }
  }

  deleteImage = (itemIndex ,imageIndex) => {
      Swal.fire({
        title: 'Are you sure you want to delete?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Delete'
      }).then((result) => {
        if (result.value) {
          const { items } = this.state;
          items[itemIndex].imageUrl.splice(imageIndex, 1);
          this.setState({ items });
          Swal.fire(
            'Deleted!',
            'Image has been deleted.',
            'success'
          )
        }
      })
    }

  handleColorSelect = (val) => {
    this.setState({ colors: val });
  }

  render() {
    const { items, images, loading } = this.state;
    console.log(this.state);
    return(
      <div className="container">
        <div className="row my-3 text-center">
          <div className='col-xl-12 '>
            <h1>ThirdLove Admin Dashboard</h1>
          </div>
        </div>
        <div className='row'>
          <div className='col-xl-12'>
          {loading
          ?
          <div className="row justify-content-center">
            <Loader
              type="RevolvingDot"
              color="#007bff"
              height={150}
              width={150}
            />
          </div>
          :
            items.map((item, itemIndex) => 
              <div key={item.uid} className="card float-left my-3 mr-3" style={{width: '18rem'}}>
                <div className="card-body">
                  <h5 className="card-title">{ item.name }</h5>
                  <p className="card-text">{ item.role }</p>
                  {
                    item.imageUrl && item.imageUrl.length
                    ?
                    item.imageUrl.map((url, index) => {
                      return (
                        <span key={index}>
                          <Img className="pr-2" width="50px" height="50px" src={url} />
                          <span className="fa fa-trash" aria-hidden="true" style={{cursor: 'pointer'}} onClick={() => this.deleteImage(itemIndex, index)} />
                        </span>
                      )
                    })
                    :
                    null
                  }
                  <p className="card-text">Total Images: { item.imageUrl ? item.imageUrl.length : 'No Images yet...' }</p>
                  <button onClick={ () => this.removeData(item) } className="btn btn-danger mr-2">Delete</button>
                  <button onClick={ () => this.updateData(item) } className="btn btn-primary mr-2">Edit</button>
                </div>
              </div>
              )
          } 
          </div>
        </div>
        <div className='row mb-3'>
          <div className='col-xl-12'>
            <h1>Add new item here</h1>
            <form onSubmit={ this.handleSubmit }>
              <div className="form-row">
                <input type='hidden' ref='uid' />
                <div className="form-group col-md-6">
                  <label>Name</label>
                  <input type="text" name="name" ref='name' className="form-control" placeholder="Name" value={this.state.name} onChange={this.handleInputChange} />
                </div>
                <div className="form-group col-md-6">
                  <label>Role</label>
                  <input type="text" name="role" ref='role' className="form-control" placeholder="Role" value={this.state.role} onChange={this.handleInputChange} />
                </div>
                <div className="form-group col-md-6">
                  <label>Image</label>
                  <input type="file" multiple={true} className="form-control file-select" accept="image/*" onChange={this.handleImageFile}/>
                </div>
                <div className="form-group col-md-6">
                  <label>Colors</label>
                  <Select
                  isMulti
                  name="colors"
                  options={COLOR_OPTIONS}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={this.state.colors}
                  onChange={(value) => this.handleColorSelect(value)}
                />
                </div>
              </div>
              <div className="">
                <button type="submit" className="btn btn-lg btn-success">Save</button>
                {this.state.saveLoading
                ?
                <Loader
                  type="RevolvingDot"
                  color="#007bff"
                  height={100}
                  width={100}
                />
                : null
                }
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
