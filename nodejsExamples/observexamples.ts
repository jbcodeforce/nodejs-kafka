import { Observable } from 'rxjs';
import { of } from 'rxjs';
/*
  Create an observable that emits 'Hello' and 'World' on  
  subscription.
*/
const hello = Observable.create(function(observer) {
  observer.next('Hello');
  observer.next('World');
});

//output: 'Hello'...'World'
const subscribe = hello.subscribe(val => console.log(val));


//emits any number of provided values in sequence
const source = of(1, 2, 3, 4, 5);
//output: 1,2,3,4,5
 source.subscribe(val => console.log(val));

export default class TestObs {

  constructor (){}

  hello(): Observable<string> {
    return of("Hello bill")
  }

  ready(): Observable<boolean> {
    return of(true);
  }
}

(()=> {
    let a = new TestObs();
    a.ready().subscribe( b => {
      if (b) {
        a.hello().subscribe(v => {console.log(v)})  
      }
    
    })
    
})();
