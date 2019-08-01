import React from 'react';
import Firebase from 'firebase';
import config from './config';
import './App.css';
import Swal from 'sweetalert2';
import Loader from 'react-loader-spinner';
import Img from 'react-image'

class App extends React.Component {

  constructor(props){
    super(props);
    Firebase.initializeApp(config);

    this.state = {
      items: [],
      images:[],
      name: '',
      role: '',
      image: null,
      loading: true,
      saveLoading: false
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
        items: data.items,
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
    const storageService = Firebase.storage();
    const storageRef = storageService.ref();
    const { images } = this.state;
    let imageUrl = '';

    try {
      if(images) { //fn to upload image
        imageUrl = await this.returnImageUrlonUpload(images[0])
      }
    } catch(error) {
      console.log('ERROR:', error);
    }

  //alternative way to code a promise
    // this.returnImageUrlonUpload(images)
    // .then((url) => {
    //   imageUrl = url;
    // })
    // .catch((error) => {
    //   console.log('ERROR:', error)
    // })

    //   if(image) { //fn to upload image
    //   imageUrl = await this.returnImageUrlonUpload(image)
    // }

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
      items[devIndex].imageUrl = imageUrl;
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
  
    // this.refs.name.value = '';
    // this.refs.role.value = '';
    // this.refs.uid.value = '';
    this.setState({
      name: '',
      role: '',
      images: [],
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
    // const newState = items.filter(data => {
    //   return data.uid !== item.uid;
    // });
    // this.setState({ items: newState });
  }
  
  updateData = (item) => {
    this.refs.uid.value = item.uid;
    // this.refs.name.value = item.name;
    // this.refs.role.value = item.role;\
    this.setState({
      name: item.name,
      role: item.role,
    })
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    })
  }

handleImageFile = (event) => {
  console.log('event', event.target.files)
  this.setState({
    images: event.target.files
  })

}

  render() {
    const { items, images,loading } = this.state;
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
            items
            .map(item => 
              <div key={item.uid} className="card float-left my-3 mr-3" style={{width: '18rem'}}>
                <div className="card-body">
                  <h5 className="card-title">{ item.name }</h5>
                  <p className="card-text">{ item.role }</p>
                  {/* <img width="50px" height="50px" src={item.imageUrl ? item.imageUrl : ''} alt={'item-pic'} /> */}
                  <Img width="50px" height="50px" src={item.imageUrl ? item.imageUrl : ''} />
                  <p className="card-text">Total Images: { images ? images.length : 'No Images yet...' }</p>
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
